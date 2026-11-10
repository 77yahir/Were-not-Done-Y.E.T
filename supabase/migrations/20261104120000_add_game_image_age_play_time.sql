
-- Board Buddies
-- Image, minimum age and average playing time for board games

-- Optional, because existing games don't have them
ALTER TABLE public.board_games
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS min_age integer,
ADD COLUMN IF NOT EXISTS avg_playing_time integer;

-- Other users' browsers may load this URL, so only allow web links
ALTER TABLE public.board_games
ADD CONSTRAINT board_games_image_url_check
CHECK (image_url IS NULL OR image_url ~ '^https?://\S+$');

ALTER TABLE public.board_games
ADD CONSTRAINT board_games_min_age_check
CHECK (min_age IS NULL OR min_age > 0);

-- In minutes
ALTER TABLE public.board_games
ADD CONSTRAINT board_games_avg_playing_time_check
CHECK (avg_playing_time IS NULL OR avg_playing_time > 0);


-- The add functions gain three parameters. They default to NULL
-- so code that doesn't send them yet keeps working. The old
-- versions must go first, or a call could match two functions
DROP FUNCTION IF EXISTS
public.add_game_to_library(text, integer, integer, text, text, text);

DROP FUNCTION IF EXISTS
public.add_game_to_wishlist(text, integer, integer, text, text);


-- Create a board game and add it to the user's catalog
CREATE FUNCTION public.add_game_to_library(
    p_title text,
    p_min_players integer,
    p_max_players integer,
    p_genre text,
    p_description text,
    p_condition text,
    p_image_url text DEFAULT NULL,
    p_min_age integer DEFAULT NULL,
    p_avg_playing_time integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
    v_board_game_id uuid;
    v_library_item_id uuid;
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

    IF p_condition IS NULL OR length(trim(p_condition)) = 0 THEN
        RAISE EXCEPTION 'Condition is required';
    END IF;

    -- Create board game
    INSERT INTO public.board_games (
        title,
        min_players,
        max_players,
        genre,
        description,
        image_url,
        min_age,
        avg_playing_time
    )
    VALUES (
        trim(p_title),
        p_min_players,
        p_max_players,
        p_genre,
        p_description,
        p_image_url,
        p_min_age,
        p_avg_playing_time
    )
    RETURNING board_game_id INTO v_board_game_id;

    -- Add the board game to the user's catalog
    INSERT INTO public.library_items (
        condition,
        owner_user_id,
        board_game_id
    )
    VALUES (
        p_condition,
        v_user_id,
        v_board_game_id
    )
    RETURNING library_item_id INTO v_library_item_id;

    RETURN v_library_item_id;
END;
$$;

-- Restrict function access
REVOKE ALL ON FUNCTION
public.add_game_to_library(text, integer, integer, text, text, text, text, integer, integer)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.add_game_to_library(text, integer, integer, text, text, text, text, integer, integer)
TO authenticated;


-- Create a board game and add it to the user's wishlist
CREATE FUNCTION public.add_game_to_wishlist(
    p_title text,
    p_min_players integer,
    p_max_players integer,
    p_genre text,
    p_description text,
    p_image_url text DEFAULT NULL,
    p_min_age integer DEFAULT NULL,
    p_avg_playing_time integer DEFAULT NULL
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
        description,
        image_url,
        min_age,
        avg_playing_time
    )
    VALUES (
        trim(p_title),
        p_min_players,
        p_max_players,
        p_genre,
        p_description,
        p_image_url,
        p_min_age,
        p_avg_playing_time
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
public.add_game_to_wishlist(text, integer, integer, text, text, text, integer, integer)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.add_game_to_wishlist(text, integer, integer, text, text, text, integer, integer)
TO authenticated;
