
-- Board Buddies
-- Create a public profile when a user signs up

-- Copy the username from sign-up metadata into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Only accounts created through the app's sign-up form
    -- carry a username; skip others (e.g. dashboard-created users)
    IF NEW.raw_user_meta_data ->> 'username' IS NOT NULL THEN
        INSERT INTO public.users (
            user_id,
            username,
            email
        )
        VALUES (
            NEW.id,
            trim(NEW.raw_user_meta_data ->> 'username'),
            NEW.email
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Only the trigger should run this function
REVOKE ALL ON FUNCTION public.handle_new_user()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
