
CREATE OR REPLACE FUNCTION public.get_community_members(
    p_group_id uuid
)
RETURNS TABLE (
    user_id uuid,
    username text,
    role text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        m.user_id,
        u.username,
        m.role
    FROM public.group_memberships m
    JOIN public.users u
        ON m.user_id = u.user_id
    WHERE m.group_id = p_group_id
        AND m.status = 'approved'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM public.group_memberships m
            WHERE m.user_id = auth.uid()
                AND m.status = 'approved'
                AND m.group_id = p_group_id
        );
$$;

REVOKE ALL ON FUNCTION public.get_community_members(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_community_members(uuid)
TO authenticated;
