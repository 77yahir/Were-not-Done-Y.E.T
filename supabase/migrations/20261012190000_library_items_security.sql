
-- Board Buddies
-- Board game catalog (library items) security

-- Store a genre for each board game
ALTER TABLE public.board_games
ADD COLUMN IF NOT EXISTS genre text;

-- Enable RLS
ALTER TABLE public.board_games
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.library_items
ENABLE ROW LEVEL SECURITY;

-- Remove broad access
REVOKE ALL ON TABLE public.board_games
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON TABLE public.library_items
FROM PUBLIC, anon, authenticated;

-- Allow authenticated users to read board games
-- and read or remove their library items
-- RLS policies will restrict which rows
GRANT SELECT ON TABLE public.board_games
TO authenticated;

GRANT SELECT, DELETE
ON TABLE public.library_items
TO authenticated;


-- Authenticated users can discover board games
CREATE POLICY "Authenticated users can view board games"
ON public.board_games
FOR SELECT
TO authenticated
USING (true);


-- Users can view their own library items
CREATE POLICY "Users can view own library items"
ON public.library_items
FOR SELECT
TO authenticated
USING (
    owner_user_id = (SELECT auth.uid())
);


-- Users can remove games from their own catalog
CREATE POLICY "Users can remove own library items"
ON public.library_items
FOR DELETE
TO authenticated
USING (
    owner_user_id = (SELECT auth.uid())
);


-- Create a board game and add it to the user's catalog
CREATE OR REPLACE FUNCTION public.add_game_to_library(
    p_title text,
    p_min_players integer,
    p_max_players integer,
    p_genre text,
    p_description text,
    p_condition text
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
public.add_game_to_library(text, integer, integer, text, text, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.add_game_to_library(text, integer, integer, text, text, text)
TO authenticated;


-- Securely retrieve the user's catalog with game details
CREATE OR REPLACE FUNCTION public.get_my_library()
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
        l.is_available

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
