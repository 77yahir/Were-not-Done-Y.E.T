
-- Board Buddies
-- A group chat for every community. Chat members aren't stored
-- separately: everyone whose membership is approved is in the chat,
-- so joining or leaving the community joins or leaves its chat

CREATE TABLE public.community_messages (
    message_id uuid NOT NULL DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL,
    sender_user_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT community_messages_pkey PRIMARY KEY (message_id),
    CONSTRAINT community_messages_group_id_fkey
        FOREIGN KEY (group_id)
        REFERENCES public.community_groups (group_id) ON DELETE CASCADE,
    CONSTRAINT community_messages_sender_user_id_fkey
        FOREIGN KEY (sender_user_id)
        REFERENCES public.users (user_id) ON DELETE CASCADE,
    CONSTRAINT community_messages_body_check
        CHECK (body ~ '\S' AND length(body) <= 2000)
);

COMMENT ON TABLE public.community_messages
IS 'Group chat messages. Each community has one chat.';

-- Load a chat in order
CREATE INDEX community_messages_group_created_idx
ON public.community_messages (group_id, created_at);

-- Enable RLS
ALTER TABLE public.community_messages
ENABLE ROW LEVEL SECURITY;

-- Remove broad access
REVOKE ALL ON TABLE public.community_messages
FROM PUBLIC, anon, authenticated;

-- Allow authenticated users to read chats
-- RLS policies will restrict which rows
-- Sending goes through the function below
GRANT SELECT ON TABLE public.community_messages
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.community_messages
TO service_role;


-- Approved members can view their community's chat
CREATE POLICY "Members can view their community chat"
ON public.community_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.group_memberships AS m
        WHERE m.group_id = community_messages.group_id
          AND m.user_id = (SELECT auth.uid())
          AND m.status = 'approved'
    )
);


-- Whether the current user is in this community's chat,
-- which means having an approved membership
CREATE OR REPLACE FUNCTION public.is_community_chat_member(
    p_group_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.group_memberships AS m
        WHERE m.group_id = p_group_id
          AND m.user_id = auth.uid()
          AND m.status = 'approved'
    );
$$;

-- Only the functions below use this
REVOKE ALL ON FUNCTION public.is_community_chat_member(uuid)
FROM PUBLIC, anon, authenticated;


-- Post a message from the current user to a community's chat
CREATE OR REPLACE FUNCTION public.send_community_message(
    p_group_id uuid,
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

    IF NOT public.is_community_chat_member(p_group_id) THEN
        RAISE EXCEPTION 'Only community members can use this chat';
    END IF;

    INSERT INTO public.community_messages (
        group_id,
        sender_user_id,
        body
    )
    VALUES (
        p_group_id,
        v_user_id,
        trim(p_body)
    )
    RETURNING message_id INTO v_message_id;

    RETURN v_message_id;
END;
$$;

-- Restrict function access
REVOKE ALL ON FUNCTION public.send_community_message(uuid, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.send_community_message(uuid, text)
TO authenticated;


-- A community's chat with each sender's username, newest first.
-- PostgREST returns at most 1000 rows, so sorting this way means
-- a very long chat still shows its latest messages
CREATE OR REPLACE FUNCTION public.get_community_messages(
    p_group_id uuid
)
RETURNS TABLE (
    message_id uuid,
    body text,
    created_at timestamp with time zone,
    sender_user_id uuid,
    sender_username text,
    is_mine boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT public.is_community_chat_member(p_group_id) THEN
        RAISE EXCEPTION 'Only community members can use this chat';
    END IF;

    RETURN QUERY
    SELECT
        cm.message_id,
        cm.body,
        cm.created_at,
        cm.sender_user_id,
        u.username,
        cm.sender_user_id = auth.uid()

    FROM public.community_messages AS cm

    JOIN public.users AS u
        ON u.user_id = cm.sender_user_id

    WHERE cm.group_id = p_group_id

    ORDER BY cm.created_at DESC, cm.message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_community_messages(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_community_messages(uuid)
TO authenticated;


-- The chats of every community the current user is an approved
-- member of, with each chat's latest message, most recent first
CREATE OR REPLACE FUNCTION public.get_my_community_chats()
RETURNS TABLE (
    group_id uuid,
    name text,
    last_message text,
    last_message_at timestamp with time zone,
    last_sender_username text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        g.group_id,
        g.name,
        latest.body,
        latest.created_at,
        latest.username

    FROM public.group_memberships AS m

    JOIN public.community_groups AS g
        ON g.group_id = m.group_id

    LEFT JOIN LATERAL (
        SELECT cm.body, cm.created_at, u.username
        FROM public.community_messages AS cm
        JOIN public.users AS u
            ON u.user_id = cm.sender_user_id
        WHERE cm.group_id = g.group_id
        ORDER BY cm.created_at DESC, cm.message_id
        LIMIT 1
    ) AS latest ON true

    WHERE m.user_id = auth.uid()
      AND m.status = 'approved'

    ORDER BY latest.created_at DESC NULLS LAST, g.name;
$$;

REVOKE ALL ON FUNCTION public.get_my_community_chats()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_community_chats()
TO authenticated;
