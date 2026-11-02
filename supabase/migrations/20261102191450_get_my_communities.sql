
CREATE OR REPLACE FUNCTION public.get_my_communities()
RETURNS TABLE (
    group_id uuid,
    name text,
    description text,
    role text
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

    RETURN QUERY
    SELECT
        g.group_id,
        g.name,
        g.description,
        CASE
            WHEN g.created_by_user_id = v_user_id
                THEN 'owner'::text
            ELSE m.role
        END
    FROM public.community_groups g
    LEFT JOIN public.group_memberships m
        ON m.group_id = g.group_id
       AND m.user_id = v_user_id
       AND m.status = 'approved'
    WHERE g.created_by_user_id = v_user_id
       OR m.membership_id IS NOT NULL
    ORDER BY g.name;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_communities()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_communities()
TO authenticated;
