-- Allow authenticated users to update their own username

CREATE OR REPLACE FUNCTION public.update_my_username(
    p_username text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_username text := trim(p_username);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF v_username IS NULL
       OR length(v_username) < 3
       OR length(v_username) > 75 THEN
        RAISE EXCEPTION 'Username must be between 3 and 75 characters';
    END IF;

    UPDATE public.users
    SET username = v_username
    WHERE user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    RETURN v_username;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Username already taken';
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_username(text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_my_username(text)
TO authenticated;