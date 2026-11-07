
-- Retrieve a user's game library
-- Only the owner or an accepted friend may view it

CREATE OR REPLACE FUNCTION public.get_user_library(
    p_user_id uuid
)
RETURNS TABLE (
    library_item_id uuid,
    board_game_id uuid,
    title text,
    min_players integer,
    max_players integer,
    genre text,
    description text,
    condition text,
    is_available boolean
)z
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_viewer_id uuid := auth.uid();
BEGIN
    IF v_viewer_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid user';
    END IF;

    -- The owner can always view their own library.
    -- Other users must have an accepted friendship.
    IF v_viewer_id <> p_user_id
       AND NOT EXISTS (
           SELECT 1
           FROM public.friendships AS f
           WHERE f.status = 'accepted'
             AND (
                 (
                     f.requester_user_id = v_viewer_id
                     AND f.recipient_user_id = p_user_id
                 )
                 OR
                 (
                     f.recipient_user_id = v_viewer_id
                     AND f.requester_user_id = p_user_id
                 )
             )
       )
    THEN
        RAISE EXCEPTION 'Not authorized to view library';
    END IF;

    RETURN QUERY
    SELECT
        l.library_item_id,
        b.board_game_id,
        b.title,
        b.min_players,
        b.max_players,
        b.genre,
        b.description,
        l.condition,
        l.is_available
    FROM public.library_items AS l
    JOIN public.board_games AS b
        ON b.board_game_id = l.board_game_id
    WHERE l.owner_user_id = p_user_id
    ORDER BY b.title;
END;
$$;

-- Only authenticated users may execute the RPC.
REVOKE ALL ON FUNCTION public.get_user_library(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_library(uuid)
TO authenticated;
