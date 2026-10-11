
-- Board Buddies
-- User profile security and username search

-- 1. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;


-- 2. Users can read their own profiles
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
    (SELECT auth.uid()) = user_id
);


-- 3. Users can update their own profiles
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
    (SELECT auth.uid()) = user_id
)
WITH CHECK (
    (SELECT auth.uid()) = user_id
);


-- 4. Restrict which columns can be updated
REVOKE UPDATE ON TABLE public.users
FROM PUBLIC, anon, authenticated;

GRANT UPDATE (username)
ON TABLE public.users
TO authenticated;


-- 5. Search users by username
-- Only returns user IDs and usernames
CREATE OR REPLACE FUNCTION public.search_users(
    search_term text
)
RETURNS TABLE (
    user_id uuid,
    username text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT u.user_id, u.username
    FROM public.users AS u
    WHERE auth.uid() IS NOT NULL
      AND length(trim(search_term)) >= 2
      AND u.username ILIKE
          '%' || replace(
              replace(
                  replace(trim(search_term), '\', '\\'),
                  '%', '\%'
              ),
              '_', '\_'
          ) || '%'
          ESCAPE '\'
    ORDER BY u.username
    LIMIT 20;
$$;


-- 6. Restrict access to the search function
REVOKE ALL ON FUNCTION public.search_users(text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.search_users(text)
TO authenticated;
