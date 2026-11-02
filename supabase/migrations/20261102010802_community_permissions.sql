
-- Get the current user's permissions for a community
CREATE OR REPLACE FUNCTION public.get_my_community_permissions(
    p_group_id uuid
)
RETURNS TABLE (
    role text,
    status text,
    can_review_requests boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_role text;
    v_status text;
    v_is_creator boolean;
BEGIN
    -- 1. Require an authenticated user
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Check whether the community exists
    -- and whether the caller created it
    SELECT (g.created_by_user_id = v_user_id)
    INTO v_is_creator
    FROM public.community_groups AS g
    WHERE g.group_id = p_group_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Community not found';
    END IF;

    -- 3. Retrieve the caller's membership
    SELECT m.role, m.status
    INTO v_role, v_status
    FROM public.group_memberships AS m
    WHERE m.group_id = p_group_id
      AND m.user_id = v_user_id;

    -- 4. Determine review permissions
    RETURN QUERY
    SELECT
        v_role,
        v_status,
        (
            COALESCE(v_is_creator, false)
            OR COALESCE(
                v_role = 'admin'
                AND v_status = 'approved',
                false
            )
        );
END;
$$;

-- 5. Remove default execution privileges
REVOKE ALL ON FUNCTION
    public.get_my_community_permissions(uuid)
FROM PUBLIC, anon, authenticated;

-- 6. Allow authenticated users to execute it
GRANT EXECUTE ON FUNCTION
    public.get_my_community_permissions(uuid)
TO authenticated;
