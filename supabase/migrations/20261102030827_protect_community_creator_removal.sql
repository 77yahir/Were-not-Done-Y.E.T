
CREATE OR REPLACE FUNCTION public.remove_community_member(
    p_group_id uuid,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor_id uuid := auth.uid();
    v_is_owner boolean;
    v_is_admin boolean;
BEGIN
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check whether the caller created the community
    SELECT EXISTS (
        SELECT 1
        FROM public.community_groups g
        WHERE g.group_id = p_group_id
          AND g.created_by_user_id = v_actor_id
    )
    INTO v_is_owner;

    -- Check whether the caller is an approved admin
    SELECT EXISTS (
        SELECT 1
        FROM public.group_memberships m
        WHERE m.group_id = p_group_id
          AND m.user_id = v_actor_id
          AND m.role = 'admin'
          AND m.status = 'approved'
    )
    INTO v_is_admin;

    IF NOT v_is_owner AND NOT v_is_admin THEN
        RAISE EXCEPTION 'Not authorized to remove members';
    END IF;

    -- Remove approved members only.
    -- Owners may remove members and admins.
    -- Admins may remove regular members.
    -- Never remove the community creator.
    UPDATE public.group_memberships m
    SET
        status = 'removed',
        role = 'member',
        reviewed_at = now()
    WHERE m.group_id = p_group_id
      AND m.user_id = p_user_id
      AND m.status = 'approved'
      AND NOT EXISTS (
          SELECT 1
          FROM public.community_groups g
          WHERE g.group_id = p_group_id
            AND g.created_by_user_id = m.user_id
      )
      AND (
          (v_is_owner AND m.role IN ('member', 'admin'))
          OR
          (v_is_admin AND m.role = 'member')
      );

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Member not found or removal not allowed';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_community_member(uuid, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.remove_community_member(uuid, uuid)
TO authenticated;
