
-- Board Buddies
-- Keep the image, minimum age and average playing time on
-- library and wishlist items as well as on the board game.
-- Run 20261104120000_add_game_image_age_play_time.sql first

ALTER TABLE public.library_items
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS min_age integer,
ADD COLUMN IF NOT EXISTS avg_playing_time integer;

ALTER TABLE public.wishlist_items
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS min_age integer,
ADD COLUMN IF NOT EXISTS avg_playing_time integer;


-- Same rules as public.board_games
ALTER TABLE public.library_items
ADD CONSTRAINT library_items_image_url_check
CHECK (image_url IS NULL OR image_url ~ '^https?://\S+$');

ALTER TABLE public.library_items
ADD CONSTRAINT library_items_min_age_check
CHECK (min_age IS NULL OR min_age > 0);

ALTER TABLE public.library_items
ADD CONSTRAINT library_items_avg_playing_time_check
CHECK (avg_playing_time IS NULL OR avg_playing_time > 0);

ALTER TABLE public.wishlist_items
ADD CONSTRAINT wishlist_items_image_url_check
CHECK (image_url IS NULL OR image_url ~ '^https?://\S+$');

ALTER TABLE public.wishlist_items
ADD CONSTRAINT wishlist_items_min_age_check
CHECK (min_age IS NULL OR min_age > 0);

ALTER TABLE public.wishlist_items
ADD CONSTRAINT wishlist_items_avg_playing_time_check
CHECK (avg_playing_time IS NULL OR avg_playing_time > 0);


-- Copy the details of games added since board games got them
UPDATE public.library_items AS l
SET
    image_url = b.image_url,
    min_age = b.min_age,
    avg_playing_time = b.avg_playing_time
FROM public.board_games AS b
WHERE b.board_game_id = l.board_game_id
  AND (
      b.image_url IS NOT NULL
      OR b.min_age IS NOT NULL
      OR b.avg_playing_time IS NOT NULL
  );

UPDATE public.wishlist_items AS w
SET
    image_url = b.image_url,
    min_age = b.min_age,
    avg_playing_time = b.avg_playing_time
FROM public.board_games AS b
WHERE b.board_game_id = w.board_game_id
  AND (
      b.image_url IS NOT NULL
      OR b.min_age IS NOT NULL
      OR b.avg_playing_time IS NOT NULL
  );


-- Create a board game and add it to the user's catalog.
-- Replacing it keeps its permissions
CREATE OR REPLACE FUNCTION public.add_game_to_library(
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
        board_game_id,
        image_url,
        min_age,
        avg_playing_time
    )
    VALUES (
        p_condition,
        v_user_id,
        v_board_game_id,
        p_image_url,
        p_min_age,
        p_avg_playing_time
    )
    RETURNING library_item_id INTO v_library_item_id;

    RETURN v_library_item_id;
END;
$$;


-- Create a board game and add it to the user's wishlist.
-- Replacing it keeps its permissions
CREATE OR REPLACE FUNCTION public.add_game_to_wishlist(
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
        board_game_id,
        image_url,
        min_age,
        avg_playing_time
    )
    VALUES (
        v_user_id,
        v_board_game_id,
        p_image_url,
        p_min_age,
        p_avg_playing_time
    )
    RETURNING wishlist_item_id INTO v_wishlist_item_id;

    RETURN v_wishlist_item_id;
END;
$$;


-- A function's returned columns can't be changed in place, so the
-- list functions are dropped and created again with their permissions
DROP FUNCTION IF EXISTS public.get_my_library();

DROP FUNCTION IF EXISTS public.get_my_wishlist();


-- Securely retrieve the user's catalog with game details
CREATE FUNCTION public.get_my_library()
RETURNS TABLE (
    library_item_id uuid,
    board_game_id uuid,
    title text,
    min_players integer,
    max_players integer,
    genre text,
    description text,
    condition text,
    is_available boolean,
    image_url text,
    min_age integer,
    avg_playing_time integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        l.library_item_id,
        b.board_game_id,
        b.title,
        b.min_players,
        b.max_players,
        b.genre,
        b.description,
        l.condition,
        l.is_available,
        l.image_url,
        l.min_age,
        l.avg_playing_time

    FROM public.library_items AS l

    JOIN public.board_games AS b
        ON b.board_game_id = l.board_game_id

    WHERE auth.uid() IS NOT NULL
      AND l.owner_user_id = auth.uid()

    ORDER BY b.title;
$$;

-- Restrict function execution
REVOKE ALL ON FUNCTION public.get_my_library()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_library()
TO authenticated;


-- Securely retrieve the user's wishlist with game details
CREATE FUNCTION public.get_my_wishlist()
RETURNS TABLE (
    wishlist_item_id uuid,
    board_game_id uuid,
    title text,
    min_players integer,
    max_players integer,
    genre text,
    description text,
    image_url text,
    min_age integer,
    avg_playing_time integer
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
        b.description,
        w.image_url,
        w.min_age,
        w.avg_playing_time

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
