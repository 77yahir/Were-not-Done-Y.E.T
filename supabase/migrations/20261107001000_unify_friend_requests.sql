
-- Retrieve incoming and outgoing pending friend requests
-- with the other user's username.

CREATE OR REPLACE FUNCTION public.get_my_friend_requests()
RETURNS TABLE (
    friendship_id uuid,
    other_user_id uuid,
    username text,
    direction text,
    created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        f.friendship_id,

        CASE
            WHEN f.requester_user_id = auth.uid()
                THEN f.recipient_user_id
            ELSE f.requester_user_id
        END AS other_user_id,

        u.username,

        CASE
            WHEN f.recipient_user_id = auth.uid()
                THEN 'incoming'::text
            ELSE 'outgoing'::text
        END AS direction,

        f.created_at

    FROM public.friendships AS f

    JOIN public.users AS u
        ON u.user_id = CASE
            WHEN f.requester_user_id = auth.uid()
                THEN f.recipient_user_id
            ELSE f.requester_user_id
        END

    WHERE auth.uid() IS NOT NULL
      AND f.status = 'pending'
      AND (
          f.requester_user_id = auth.uid()
          OR f.recipient_user_id = auth.uid()
      )

    ORDER BY f.created_at DESC, f.friendship_id;
$$;

-- Restrict access to authenticated users
REVOKE ALL ON FUNCTION public.get_my_friend_requests()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_friend_requests()
TO authenticated;
