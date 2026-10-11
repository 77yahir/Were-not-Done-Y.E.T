
-- Board Buddies
-- Friendship security

-- Enable RLS
ALTER TABLE public.friendships
ENABLE ROW LEVEL SECURITY;

-- Remove broad access
REVOKE ALL ON TABLE public.friendships
FROM PUBLIC, anon, authenticated;

-- Allow authenticated users to read,
-- create, and remove friendship records
-- RLS policies will restrict which rows
GRANT SELECT, INSERT, DELETE
ON TABLE public.friendships
TO authenticated;


-- Users can view friendships they participate in
CREATE POLICY "Users can view own friendships"
ON public.friendships
FOR SELECT
TO authenticated
USING (
    (SELECT auth.uid()) = requester_user_id
    OR
    (SELECT auth.uid()) = recipient_user_id
);


-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.friendships
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.uid()) = requester_user_id
    AND status = 'pending'
    AND requester_user_id <> recipient_user_id
);


-- Users can cancel pending requests
-- or remove accepted friendships
CREATE POLICY "Users can remove friendships"
ON public.friendships
FOR DELETE
TO authenticated
USING (
    (
        status = 'pending'
        AND (SELECT auth.uid()) = requester_user_id
    )
    OR
    (
        status = 'accepted'
        AND (
            (SELECT auth.uid()) = requester_user_id
            OR
            (SELECT auth.uid()) = recipient_user_id
        )
    )
);


-- Accept or decline a pending friend request
CREATE OR REPLACE FUNCTION public.respond_to_friend_request(
    p_friendship_id uuid,
    p_response text
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

    IF p_response NOT IN ('accepted', 'declined')
       OR p_response IS NULL THEN
        RAISE EXCEPTION 'Invalid response';
    END IF;

    UPDATE public.friendships
    SET
        status = p_response,
        responded_at = now()
    WHERE friendship_id = p_friendship_id
      AND recipient_user_id = auth.uid()
      AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Request not found or action not allowed';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION
public.respond_to_friend_request(uuid, text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
public.respond_to_friend_request(uuid, text)
TO authenticated;


-- Original requester can resend a declined request
CREATE OR REPLACE FUNCTION public.resend_friend_request(
    p_friendship_id uuid
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

    UPDATE public.friendships
    SET
        status = 'pending',
        responded_at = NULL
    WHERE friendship_id = p_friendship_id
      AND requester_user_id = auth.uid()
      AND status = 'declined';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Request not found or action not allowed';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION
public.resend_friend_request(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
public.resend_friend_request(uuid)
TO authenticated;
