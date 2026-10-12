
-- Board Buddies
-- Securely retrieve accepted friends with usernames

CREATE OR REPLACE FUNCTION public.get_accepted_friends()
RETURNS TABLE (
    friendship_id uuid,
    friend_user_id uuid,
    username text
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
        END AS friend_user_id,

        u.username

    FROM public.friendships AS f

    JOIN public.users AS u
        ON u.user_id = CASE
            WHEN f.requester_user_id = auth.uid()
                THEN f.recipient_user_id
            ELSE f.requester_user_id
        END

    WHERE f.status = 'accepted'
      AND auth.uid() IS NOT NULL
      AND (
          f.requester_user_id = auth.uid()
          OR f.recipient_user_id = auth.uid()
      );
$$;

-- Restrict function execution
REVOKE ALL ON FUNCTION public.get_accepted_friends()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_accepted_friends()
TO authenticated;
