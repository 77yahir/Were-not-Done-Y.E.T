
-- Board Buddies
-- Direct messages between friends and community members

CREATE TABLE public.messages (
    message_id uuid NOT NULL DEFAULT gen_random_uuid(),
    sender_user_id uuid NOT NULL,
    recipient_user_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    read_at timestamp with time zone,
    CONSTRAINT messages_pkey PRIMARY KEY (message_id),
    CONSTRAINT messages_sender_user_id_fkey
        FOREIGN KEY (sender_user_id)
        REFERENCES public.users (user_id) ON DELETE CASCADE,
    CONSTRAINT messages_recipient_user_id_fkey
        FOREIGN KEY (recipient_user_id)
        REFERENCES public.users (user_id) ON DELETE CASCADE,
    CONSTRAINT messages_distinct_users_check
        CHECK (sender_user_id <> recipient_user_id),
    CONSTRAINT messages_body_check
        CHECK (body ~ '\S' AND length(body) <= 2000)
);

COMMENT ON TABLE public.messages
IS 'Direct messages between two users.';

-- Find a conversation from either side
CREATE INDEX messages_sender_recipient_idx
ON public.messages (sender_user_id, recipient_user_id, created_at);

CREATE INDEX messages_recipient_sender_idx
ON public.messages (recipient_user_id, sender_user_id, created_at);

-- Enable RLS
ALTER TABLE public.messages
ENABLE ROW LEVEL SECURITY;

-- Remove broad access
REVOKE ALL ON TABLE public.messages
FROM PUBLIC, anon, authenticated;

-- Allow authenticated users to read their messages
-- RLS policies will restrict which rows
-- Sending and marking as read go through the functions below
GRANT SELECT ON TABLE public.messages
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages
TO service_role;


-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
    (SELECT auth.uid()) = sender_user_id
    OR
    (SELECT auth.uid()) = recipient_user_id
);


-- Whether the current user may message this user. They must be
-- accepted friends or approved members of the same community,
-- and a blocked friendship always prevents messaging
CREATE OR REPLACE FUNCTION public.can_message_user(
    p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        auth.uid() IS NOT NULL
        AND p_user_id <> auth.uid()
        AND NOT EXISTS (
            SELECT 1
            FROM public.friendships AS f
            WHERE f.status = 'blocked'
              AND auth.uid() IN (f.requester_user_id, f.recipient_user_id)
              AND p_user_id IN (f.requester_user_id, f.recipient_user_id)
        )
        AND (
            EXISTS (
                SELECT 1
                FROM public.friendships AS f
                WHERE f.status = 'accepted'
                  AND auth.uid() IN (f.requester_user_id, f.recipient_user_id)
                  AND p_user_id IN (f.requester_user_id, f.recipient_user_id)
            )
            OR EXISTS (
                SELECT 1
                FROM public.group_memberships AS mine
                JOIN public.group_memberships AS theirs
                    ON theirs.group_id = mine.group_id
                WHERE mine.user_id = auth.uid()
                  AND mine.status = 'approved'
                  AND theirs.user_id = p_user_id
                  AND theirs.status = 'approved'
            )
        );
$$;

-- Only the functions below use this
REVOKE ALL ON FUNCTION public.can_message_user(uuid)
FROM PUBLIC, anon, authenticated;


-- Save a message from the current user
CREATE OR REPLACE FUNCTION public.send_message(
    p_recipient_user_id uuid,
    p_body text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_message_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_body IS NULL OR p_body !~ '\S' THEN
        RAISE EXCEPTION 'Message cannot be empty';
    END IF;

    IF length(p_body) > 2000 THEN
        RAISE EXCEPTION 'Message is too long';
    END IF;

    IF public.can_message_user(p_recipient_user_id) IS NOT TRUE THEN
        RAISE EXCEPTION
            'You can only message friends or community members';
    END IF;

    INSERT INTO public.messages (
        sender_user_id,
        recipient_user_id,
        body
    )
    VALUES (
        v_user_id,
        p_recipient_user_id,
        trim(p_body)
    )
    RETURNING message_id INTO v_message_id;

    RETURN v_message_id;
END;
$$;

-- Restrict function access
REVOKE ALL ON FUNCTION public.send_message(uuid, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.send_message(uuid, text)
TO authenticated;


-- A conversation with another user, newest message first.
-- PostgREST returns at most 1000 rows, so sorting this way means
-- a very long conversation still shows its latest messages
CREATE OR REPLACE FUNCTION public.get_conversation(
    p_other_user_id uuid
)
RETURNS TABLE (
    message_id uuid,
    body text,
    created_at timestamp with time zone,
    read_at timestamp with time zone,
    is_mine boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        m.message_id,
        m.body,
        m.created_at,
        m.read_at,
        m.sender_user_id = auth.uid()

    FROM public.messages AS m

    WHERE auth.uid() IS NOT NULL
      AND (
          (
              m.sender_user_id = auth.uid()
              AND m.recipient_user_id = p_other_user_id
          )
          OR
          (
              m.sender_user_id = p_other_user_id
              AND m.recipient_user_id = auth.uid()
          )
      )

    ORDER BY m.created_at DESC, m.message_id;
$$;

REVOKE ALL ON FUNCTION public.get_conversation(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_conversation(uuid)
TO authenticated;


-- Everyone the current user can message, plus anyone they already
-- have messages with, most recent conversation first.
-- Past conversations stay listed after a friendship or
-- community membership ends
CREATE OR REPLACE FUNCTION public.get_my_conversations()
RETURNS TABLE (
    user_id uuid,
    username text,
    is_friend boolean,
    can_message boolean,
    last_message text,
    last_message_at timestamp with time zone,
    unread_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    WITH friends AS (
        SELECT
            CASE
                WHEN f.requester_user_id = auth.uid()
                    THEN f.recipient_user_id
                ELSE f.requester_user_id
            END AS user_id
        FROM public.friendships AS f
        WHERE f.status = 'accepted'
          AND auth.uid() IN (f.requester_user_id, f.recipient_user_id)
    ),
    community_members AS (
        SELECT theirs.user_id
        FROM public.group_memberships AS mine
        JOIN public.group_memberships AS theirs
            ON theirs.group_id = mine.group_id
        WHERE mine.user_id = auth.uid()
          AND mine.status = 'approved'
          AND theirs.status = 'approved'
    ),
    my_messages AS (
        SELECT
            CASE
                WHEN m.sender_user_id = auth.uid()
                    THEN m.recipient_user_id
                ELSE m.sender_user_id
            END AS user_id,
            m.body,
            m.created_at,
            m.recipient_user_id = auth.uid()
                AND m.read_at IS NULL AS is_unread
        FROM public.messages AS m
        WHERE auth.uid() IN (m.sender_user_id, m.recipient_user_id)
    ),
    contacts AS (
        SELECT friends.user_id FROM friends
        UNION
        SELECT community_members.user_id FROM community_members
        UNION
        SELECT my_messages.user_id FROM my_messages
    )
    SELECT
        c.user_id,
        u.username,
        c.user_id IN (SELECT friends.user_id FROM friends),
        public.can_message_user(c.user_id),
        latest.body,
        latest.created_at,
        (
            SELECT count(*)
            FROM my_messages AS mm
            WHERE mm.user_id = c.user_id
              AND mm.is_unread
        )

    FROM contacts AS c

    JOIN public.users AS u
        ON u.user_id = c.user_id

    LEFT JOIN LATERAL (
        SELECT mm.body, mm.created_at
        FROM my_messages AS mm
        WHERE mm.user_id = c.user_id
        ORDER BY mm.created_at DESC
        LIMIT 1
    ) AS latest ON true

    WHERE latest.created_at IS NOT NULL
       OR public.can_message_user(c.user_id)

    ORDER BY latest.created_at DESC NULLS LAST, u.username;
$$;

REVOKE ALL ON FUNCTION public.get_my_conversations()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_conversations()
TO authenticated;


-- How many messages the current user hasn't read yet
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT count(*)
    FROM public.messages AS m
    WHERE m.recipient_user_id = auth.uid()
      AND m.read_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.get_unread_message_count()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_unread_message_count()
TO authenticated;


-- Mark everything this user sent to the current user as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(
    p_other_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE public.messages
    SET read_at = now()
    WHERE recipient_user_id = auth.uid()
      AND sender_user_id = p_other_user_id
      AND read_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid)
TO authenticated;
