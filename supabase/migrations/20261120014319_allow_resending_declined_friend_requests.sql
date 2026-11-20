
-- Allow authenticated users to resend declined friend requests.
-- Preserve the unique constraint preventing duplicate relationships.

CREATE OR REPLACE FUNCTION public.send_friend_request(
    p_recipient_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_requester_id uuid := auth.uid();
    v_friendship_id uuid;
    v_status text;
BEGIN
    IF v_requester_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_recipient_id IS NULL THEN
        RAISE EXCEPTION 'Recipient is required';
    END IF;

    IF v_requester_id = p_recipient_id THEN
        RAISE EXCEPTION 'Cannot send a friend request to yourself';
    END IF;

    -- Confirm the recipient exists.
    IF NOT EXISTS (
        SELECT 1
        FROM public.users
        WHERE user_id = p_recipient_id
    ) THEN
        RAISE EXCEPTION 'Recipient not found';
    END IF;

    -- Serialize requests for the same unordered pair of users.
    PERFORM pg_advisory_xact_lock(
        hashtextextended(
            LEAST(v_requester_id, p_recipient_id)::text ||
            ':' ||
            GREATEST(v_requester_id, p_recipient_id)::text,
            0
        )
    );

    SELECT f.friendship_id, f.status
    INTO v_friendship_id, v_status
    FROM public.friendships f
    WHERE
        (f.requester_user_id = v_requester_id
         AND f.recipient_user_id = p_recipient_id)
        OR
        (f.requester_user_id = p_recipient_id
         AND f.recipient_user_id = v_requester_id)
    FOR UPDATE;

    IF FOUND THEN
        IF v_status <> 'declined' THEN
            RAISE EXCEPTION 'Friend request or friendship already exists';
        END IF;

        -- Reopen the declined relationship with the new requester.
        UPDATE public.friendships
        SET requester_user_id = v_requester_id,
            recipient_user_id = p_recipient_id,
            status = 'pending',
            created_at = now(),
            responded_at = NULL
        WHERE friendship_id = v_friendship_id;

        RETURN v_friendship_id;
    END IF;

    -- No existing relationship: create a new request.
    INSERT INTO public.friendships (
        requester_user_id,
        recipient_user_id,
        status
    )
    VALUES (
        v_requester_id,
        p_recipient_id,
        'pending'
    )
    RETURNING friendship_id INTO v_friendship_id;

    RETURN v_friendship_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_friend_request(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.send_friend_request(uuid)
TO authenticated;
