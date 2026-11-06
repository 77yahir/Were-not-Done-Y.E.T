
-- Retrieve all discoverable communities and
-- the current user's membership status

CREATE OR REPLACE FUNCTION public.get_discoverable_communities()
RETURNS TABLE (
    group_id uuid,
    name text,
    description text,
    membership_status text,
    membership_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    -- Require authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT
        g.group_id,
        g.name,
        g.description,

        -- Treat the creator as an approved owner
        CASE
            WHEN g.created_by_user_id = v_user_id
                THEN 'approved'::text
            ELSE m.status
        END AS membership_status,

        CASE
            WHEN g.created_by_user_id = v_user_id
                THEN 'owner'::text
            ELSE m.role
        END AS membership_role

    FROM public.community_groups AS g

    LEFT JOIN public.group_memberships AS m
        ON m.group_id = g.group_id
       AND m.user_id = v_user_id

    ORDER BY g.name, g.group_id;
END;
$$;

-- Restrict RPC execution
REVOKE ALL ON FUNCTION public.get_discoverable_communities()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_discoverable_communities()
TO authenticated;
