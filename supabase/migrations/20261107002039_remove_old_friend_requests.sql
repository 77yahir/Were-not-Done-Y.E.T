-- Retire the old pending friend requests RPC.
-- Replaced by get_my_friend_requests().

DROP FUNCTION IF EXISTS public.get_pending_friend_requests();