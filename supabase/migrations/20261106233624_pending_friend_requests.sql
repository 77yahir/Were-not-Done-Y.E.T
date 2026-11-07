
-- Retrieve incoming pending friend requests
-- with the requester's username.

CREATE OR REPLACE FUNCTION public.get_pending_friend_requests()
RETURNS TABLE (
    friendship_id uuid,
    requester_user_id uuid,
    username text,
    created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        f.friendship_id,
        f.requester_user_id,
        u.username,
        f.created_at
    FROM public.friendships AS f
    JOIN public.users AS u
        ON u.user_id = f.requester_user_id
    WHERE f.recipient_user_id = (SELECT auth.uid())
      AND f.status = 'pending'
      AND (SELECT auth.uid()) IS NOT NULL
    ORDER BY f.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_pending_friend_requests()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_pending_friend_requests()
TO authenticated;
