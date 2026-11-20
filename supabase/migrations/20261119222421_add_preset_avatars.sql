
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_id text;

ALTER TABLE public.users
ADD CONSTRAINT users_avatar_id_check
CHECK (
    avatar_id IS NULL OR avatar_id IN (
        'meeple', 'cat', 'fox',
        'bear', 'robot', 'wizard'
    )
);

CREATE OR REPLACE FUNCTION public.update_my_avatar(
    p_avatar_id text
)
RETURNS text
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

    IF p_avatar_id IS NOT NULL
       AND p_avatar_id NOT IN (
           'meeple', 'cat', 'fox',
           'bear', 'robot', 'wizard'
       ) THEN
        RAISE EXCEPTION 'Invalid avatar';
    END IF;

    UPDATE public.users
    SET avatar_id = p_avatar_id
    WHERE user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    RETURN p_avatar_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_avatar(text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_my_avatar(text)
TO authenticated;
