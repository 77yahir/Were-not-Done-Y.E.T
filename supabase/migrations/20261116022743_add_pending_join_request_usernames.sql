-- Add usernames to pending community join requests

DROP FUNCTION IF EXISTS public.get_pending_join_requests(uuid);

CREATE FUNCTION public.get_pending_join_requests(
    p_group_id uuid
)
RETURNS TABLE (
    membership_id uuid,
    user_id uuid,
    username text,
    requested_at timestamptz
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

    -- Only community creators and approved admins
    -- can view pending requests
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
        m.requested_at
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