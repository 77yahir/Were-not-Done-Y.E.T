
-- Retrieve basic public profile information.
-- Never expose email addresses.

CREATE OR REPLACE FUNCTION public.get_user_profile(
    p_user_id uuid
)
RETURNS TABLE (
    user_id uuid,
    username text,
    created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        u.user_id,
        u.username,
        u.created_at
    FROM public.users AS u
    WHERE u.user_id = p_user_id
      AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_user_profile(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_profile(uuid)
TO authenticated;
