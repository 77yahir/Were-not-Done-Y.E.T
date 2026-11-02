
-- Board Buddies
-- Wishlist items security

-- Enable RLS
ALTER TABLE public.wishlist_items
ENABLE ROW LEVEL SECURITY;

-- Remove broad access
REVOKE ALL ON TABLE public.wishlist_items
FROM PUBLIC, anon, authenticated;

-- Allow authenticated users to read or remove
-- their wishlist items
-- RLS policies will restrict which rows
GRANT SELECT, DELETE
ON TABLE public.wishlist_items
TO authenticated;


-- Users can view their own wishlist items
CREATE POLICY "Users can view own wishlist items"
ON public.wishlist_items
FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.uid())
);


-- Users can remove games from their own wishlist
CREATE POLICY "Users can remove own wishlist items"
ON public.wishlist_items
FOR DELETE
TO authenticated
USING (
    user_id = (SELECT auth.uid())
);


-- Create a board game and add it to the user's wishlist
CREATE OR REPLACE FUNCTION public.add_game_to_wishlist(
    p_title text,
    p_min_players integer,
    p_max_players integer,
    p_genre text,
    p_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
    v_board_game_id uuid;
    v_wishlist_item_id uuid;
BEGIN
    -- Get authenticated user
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate required fields
    IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
        RAISE EXCEPTION 'Title is required';
    END IF;

    -- Every add creates a new board game, so the
    -- (user_id, board_game_id) key can't catch repeats.
    -- Compare titles instead
    IF EXISTS (
        SELECT 1
        FROM public.wishlist_items AS w
        JOIN public.board_games AS b
            ON b.board_game_id = w.board_game_id
        WHERE w.user_id = v_user_id
          AND lower(b.title) = lower(trim(p_title))
    ) THEN
        RAISE EXCEPTION 'Game is already on your wishlist'
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Create board game
    INSERT INTO public.board_games (
        title,
        min_players,
        max_players,
        genre,
        description
    )
    VALUES (
        trim(p_title),
        p_min_players,
        p_max_players,
        p_genre,
        p_description
    )
    RETURNING board_game_id INTO v_board_game_id;

    -- Add the board game to the user's wishlist
    INSERT INTO public.wishlist_items (
        user_id,
        board_game_id
    )
    VALUES (
        v_user_id,
        v_board_game_id
    )
    RETURNING wishlist_item_id INTO v_wishlist_item_id;

    RETURN v_wishlist_item_id;
END;
$$;

-- Restrict function access
REVOKE ALL ON FUNCTION
public.add_game_to_wishlist(text, integer, integer, text, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.add_game_to_wishlist(text, integer, integer, text, text)
TO authenticated;


-- Securely retrieve the user's wishlist with game details
CREATE OR REPLACE FUNCTION public.get_my_wishlist()
RETURNS TABLE (
    wishlist_item_id uuid,
    board_game_id uuid,
    title text,
    min_players integer,
    max_players integer,
    genre text,
    description text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        w.wishlist_item_id,
        b.board_game_id,
        b.title,
        b.min_players,
        b.max_players,
        b.genre,
        b.description

    FROM public.wishlist_items AS w

    JOIN public.board_games AS b
        ON b.board_game_id = w.board_game_id

    WHERE auth.uid() IS NOT NULL
      AND w.user_id = auth.uid()

    ORDER BY b.title;
$$;

-- Restrict function execution
REVOKE ALL ON FUNCTION public.get_my_wishlist()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_wishlist()
TO authenticated;
