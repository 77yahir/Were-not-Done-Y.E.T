
-- Include preset avatars in public user profiles.
-- Email addresses remain private.

DROP FUNCTION IF EXISTS public.get_user_profile(uuid);

CREATE FUNCTION public.get_user_profile(
    p_user_id uuid
)
RETURNS TABLE (
    user_id uuid,
    username text,
    created_at timestamptz,
    avatar_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        u.user_id,
        u.username,
        u.created_at,
        u.avatar_id
    FROM public.users AS u
    WHERE u.user_id = p_user_id
      AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_user_profile(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_profile(uuid)
TO authenticated;


-- Include avatars in community member listings.
-- Preserve approved-members-only access.

DROP FUNCTION IF EXISTS public.get_community_members(uuid);

CREATE FUNCTION public.get_community_members(
    p_group_id uuid
)
RETURNS TABLE (
    user_id uuid,
    username text,
    role text,
    avatar_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        m.user_id,
        u.username,
        m.role,
        u.avatar_id
    FROM public.group_memberships AS m
    JOIN public.users AS u
        ON m.user_id = u.user_id
    WHERE m.group_id = p_group_id
      AND m.status = 'approved'
      AND auth.uid() IS NOT NULL
      AND EXISTS (
          SELECT 1
          FROM public.group_memberships AS viewer
          WHERE viewer.user_id = auth.uid()
            AND viewer.status = 'approved'
            AND viewer.group_id = p_group_id
      );
$$;

REVOKE ALL ON FUNCTION public.get_community_members(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_community_members(uuid)
TO authenticated;


-- Include preset avatars in accepted friends.
-- Preserve existing friendship authorization.

DROP FUNCTION IF EXISTS public.get_accepted_friends();

CREATE FUNCTION public.get_accepted_friends()
RETURNS TABLE (
    friendship_id uuid,
    friend_user_id uuid,
    username text,
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
        END AS friend_user_id,

        u.username,
        u.avatar_id

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

REVOKE ALL ON FUNCTION public.get_accepted_friends()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_accepted_friends()
TO authenticated;


-- Include avatars in pending community join requests.
-- Preserve existing username support and owner/admin authorization.

DROP FUNCTION IF EXISTS public.get_pending_join_requests(uuid);

CREATE FUNCTION public.get_pending_join_requests(
    p_group_id uuid
)
RETURNS TABLE (
    membership_id uuid,
    user_id uuid,
    username text,
    requested_at timestamptz,
    avatar_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.community_groups g
        WHERE g.group_id = p_group_id
          AND (
              g.created_by_user_id = v_user_id
              OR EXISTS (
                  SELECT 1
                  FROM public.group_memberships a
                  WHERE a.group_id = p_group_id
                    AND a.user_id = v_user_id
                    AND a.role = 'admin'
                    AND a.status = 'approved'
              )
          )
    ) THEN
        RAISE EXCEPTION 'Not authorized to view requests';
    END IF;

    RETURN QUERY
    SELECT
        m.membership_id,
        m.user_id,
        u.username,
        m.requested_at,
        u.avatar_id
    FROM public.group_memberships m
    JOIN public.users u
        ON u.user_id = m.user_id
    WHERE m.group_id = p_group_id
      AND m.status = 'pending'
      AND m.role = 'member'
    ORDER BY m.requested_at;
END;
$$;

REVOKE ALL ON FUNCTION public.get_pending_join_requests(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_pending_join_requests(uuid)
TO authenticated;

