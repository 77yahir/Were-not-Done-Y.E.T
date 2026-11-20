
-- Include preset avatars in user search results.

DROP FUNCTION IF EXISTS public.search_users(text);

CREATE FUNCTION public.search_users(
    search_term text
)
RETURNS TABLE (
    user_id uuid,
    username text,
    avatar_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        u.user_id,
        u.username,
        u.avatar_id
    FROM public.users AS u
    WHERE auth.uid() IS NOT NULL
      AND length(trim(search_term)) >= 2
      AND u.username ILIKE
          '%' || replace(
              replace(
                  replace(trim(search_term), '\', '\\'),
                  '%', '\%'
              ),
              '_', '\_'
          ) || '%'
          ESCAPE '\'
    ORDER BY u.username
    LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.search_users(text)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.search_users(text)
TO authenticated;


-- Include preset avatars in incoming and outgoing friend requests.

DROP FUNCTION IF EXISTS public.get_my_friend_requests();

CREATE FUNCTION public.get_my_friend_requests()
RETURNS TABLE (
    friendship_id uuid,
    other_user_id uuid,
    username text,
    direction text,
    created_at timestamptz,
    avatar_id text
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

        f.created_at,
        u.avatar_id

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

REVOKE ALL ON FUNCTION public.get_my_friend_requests()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_friend_requests()
TO authenticated;
