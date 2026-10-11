
-- Board Buddies
-- Community groups and memberships security

-- Enable Row Level Security
ALTER TABLE public.community_groups
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.group_memberships
ENABLE ROW LEVEL SECURITY;

-- Remove broad default permissions
REVOKE ALL ON TABLE public.community_groups
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON TABLE public.group_memberships
FROM PUBLIC, anon, authenticated;

-- Allow authenticated users to read communities
-- and their own membership records
GRANT SELECT ON TABLE public.community_groups
TO authenticated;

GRANT SELECT ON TABLE public.group_memberships
TO authenticated;


-- Authenticated users can discover communities
CREATE POLICY "Authenticated users can view communities"
ON public.community_groups
FOR SELECT
TO authenticated
USING (true);

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
ON public.group_memberships
FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.uid())
);


-- Create a community and its owner membership
CREATE OR REPLACE FUNCTION public.create_community(
    p_name text,
    p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
    v_group_id uuid;
BEGIN
    -- Get authenticated user
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate community name
    IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
        RAISE EXCEPTION 'Community name is required';
    END IF;

    -- Create community
    INSERT INTO public.community_groups (
        name,
        description,
        created_by_user_id
    )
    VALUES (
        trim(p_name),
        p_description,
        v_user_id
    )
    RETURNING group_id INTO v_group_id;

    -- Automatically assign creator as owner
    INSERT INTO public.group_memberships (
        group_id,
        user_id,
        role,
        status,
        reviewed_at
    )
    VALUES (
        v_group_id,
        v_user_id,
        'owner',
        'approved',
        now()
    );

    RETURN v_group_id;
END;
$$;

-- Restrict function access
REVOKE ALL ON FUNCTION public.create_community(text, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_community(text, text)
TO authenticated;


-- Request to join a community
CREATE OR REPLACE FUNCTION public.request_to_join_community(
    p_group_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Create a new pending membership if none exists
    INSERT INTO public.group_memberships (
        group_id,
        user_id,
        role,
        status
    )
    VALUES (
        p_group_id,
        v_user_id,
        'member',
        'pending'
    )
    ON CONFLICT (group_id, user_id)
    DO UPDATE SET
        role = 'member',
        status = 'pending',
        requested_at = now(),
        reviewed_at = NULL
    WHERE group_memberships.status
          IN ('rejected', 'removed');

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Membership already pending or approved';
    END IF;
END;
$$;

-- Restrict execution
REVOKE ALL ON FUNCTION public.request_to_join_community(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.request_to_join_community(uuid)
TO authenticated;


-- Owner or approved admin can review join requests
CREATE OR REPLACE FUNCTION public.review_join_request(
    p_membership_id uuid,
    p_decision text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_group_id uuid;
    v_reviewer_id uuid;
BEGIN
    v_reviewer_id := auth.uid();

    IF v_reviewer_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_decision IS NULL
       OR p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid decision';
    END IF;

    -- Find the group containing the pending request
    SELECT m.group_id
    INTO v_group_id
    FROM public.group_memberships AS m
    WHERE m.membership_id = p_membership_id
      AND m.status = 'pending';

    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Pending request not found';
    END IF;

    -- Verify reviewer is creator or approved admin
    IF NOT EXISTS (
        SELECT 1
        FROM public.community_groups AS g
        WHERE g.group_id = v_group_id
          AND (
              g.created_by_user_id = v_reviewer_id
              OR EXISTS (
                  SELECT 1
                  FROM public.group_memberships AS a
                  WHERE a.group_id = v_group_id
                    AND a.user_id = v_reviewer_id
                    AND a.role = 'admin'
                    AND a.status = 'approved'
              )
          )
    ) THEN
        RAISE EXCEPTION 'Not authorized to review requests';
    END IF;

    -- Apply decision
    UPDATE public.group_memberships
    SET
        status = p_decision,
        reviewed_at = now()
    WHERE membership_id = p_membership_id
      AND status = 'pending'
      AND role = 'member';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request could not be updated';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_join_request(uuid, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.review_join_request(uuid, text)
TO authenticated;


-- Only the community creator can appoint admins
CREATE OR REPLACE FUNCTION public.appoint_community_admin(
    p_group_id uuid,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Only the original creator can appoint admins
    IF NOT EXISTS (
        SELECT 1
        FROM public.community_groups
        WHERE group_id = p_group_id
          AND created_by_user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only the creator can appoint admins';
    END IF;

    -- User must already be an approved regular member
    UPDATE public.group_memberships
    SET role = 'admin'
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND role = 'member'
      AND status = 'approved';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'User must be an approved regular member';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION
public.appoint_community_admin(uuid, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.appoint_community_admin(uuid, uuid)
TO authenticated;


-- Remove a community member
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

    -- Check whether the current user is the creator
    SELECT EXISTS (
        SELECT 1
        FROM public.community_groups g
        WHERE g.group_id = p_group_id
          AND g.created_by_user_id = v_actor_id
    )
    INTO v_is_owner;

    -- Check whether the current user is an approved admin
    SELECT EXISTS (
        SELECT 1
        FROM public.group_memberships m
        WHERE m.group_id = p_group_id
          AND m.user_id = v_actor_id
          AND m.role = 'admin'
          AND m.status = 'approved'
    )
    INTO v_is_admin;

    -- Only owners and admins can remove members
    IF NOT v_is_owner AND NOT v_is_admin THEN
        RAISE EXCEPTION 'Not authorized to remove members';
    END IF;

    -- Remove only approved members.
    -- Admins may remove regular members.
    -- Only the creator may remove admins.
    -- The owner cannot be removed.
    UPDATE public.group_memberships m
    SET
        status = 'removed',
        role = 'member',
        reviewed_at = now()
    WHERE m.group_id = p_group_id
      AND m.user_id = p_user_id
      AND m.status = 'approved'
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

-- Restrict execution
REVOKE ALL ON FUNCTION public.remove_community_member(uuid, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.remove_community_member(uuid, uuid)
TO authenticated;
