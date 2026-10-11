SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

CREATE TABLE "public"."board_game_offers" (
  "offer_id"      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "current_price" numeric(10,2)            NOT NULL,
  "sale_price"    numeric(10,2),
  "sale_end_date" timestamp with time zone,
  "product_url"   text                     NOT NULL,
  "store_id"      uuid                     NOT NULL,
  "board_game_id" uuid                     NOT NULL,
  "created_at"    timestamp with time zone,
  CONSTRAINT "board_game_offers_pkey" PRIMARY KEY (offer_id),
  CONSTRAINT "board_game_offers_prices_nonnegative_check" CHECK (((current_price >= (0)::numeric) AND ((sale_price IS NULL) OR (sale_price >= (0)::numeric)))),
  CONSTRAINT "board_game_offers_sale_price_check" CHECK (((sale_price IS NULL) OR (sale_price <= current_price)))
);

ALTER TABLE "public"."board_game_offers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."board_games" (
  "board_game_id" uuid    NOT NULL DEFAULT gen_random_uuid(),
  "title"         text    NOT NULL,
  "min_players"   integer NOT NULL,
  "max_players"   integer NOT NULL,
  "description"   text,
  CONSTRAINT "board_games_pkey" PRIMARY KEY (board_game_id),
  CONSTRAINT "board_games_player_count_check" CHECK (((min_players > 0) AND (max_players >= min_players)))
);

ALTER TABLE "public"."board_games"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."borrowing_records" (
  "borrowing_id"     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "borrowed_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "due_at"           timestamp with time zone NOT NULL,
  "returned_at"      timestamp with time zone,
  "status"           text                     NOT NULL DEFAULT 'active'::text,
  "library_item_id"  uuid                     NOT NULL,
  "borrower_user_id" uuid                     NOT NULL,
  CONSTRAINT "borrowing_records_due_after_borrowed_check" CHECK ((due_at > borrowed_at)),
  CONSTRAINT "borrowing_records_pkey" PRIMARY KEY (borrowing_id),
  CONSTRAINT "borrowing_records_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'returned'::text, 'overdue'::text, 'cancelled'::text])))
);

ALTER TABLE "public"."borrowing_records"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."community_groups" (
  "group_id"           uuid NOT NULL DEFAULT gen_random_uuid(),
  "name"               text NOT NULL,
  "description"        text,
  "created_by_user_id" uuid NOT NULL,
  CONSTRAINT "community_groups_pkey" PRIMARY KEY (group_id)
);

ALTER TABLE "public"."community_groups"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."friendships" (
  "friendship_id"     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "requester_user_id" uuid                     NOT NULL,
  "recipient_user_id" uuid                     NOT NULL,
  "status"            text                     NOT NULL DEFAULT 'pending'::text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "responded_at"      timestamp with time zone,
  CONSTRAINT "friendships_distinct_users_check" CHECK ((requester_user_id <> recipient_user_id)),
  CONSTRAINT "friendships_pkey" PRIMARY KEY (friendship_id),
  CONSTRAINT "friendships_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'blocked'::text])))
);

ALTER TABLE "public"."friendships"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."group_memberships" (
  "membership_id" uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "role"          text                     NOT NULL DEFAULT 'member'::text,
  "status"        text                     NOT NULL DEFAULT 'pending'::text,
  "requested_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "reviewed_at"   timestamp with time zone,
  "group_id"      uuid                     NOT NULL,
  "user_id"       uuid                     NOT NULL,
  CONSTRAINT "group_memberships_group_user_key" UNIQUE (group_id, user_id),
  CONSTRAINT "group_memberships_pkey" PRIMARY KEY (membership_id),
  CONSTRAINT "group_memberships_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text]))),
  CONSTRAINT "group_memberships_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'removed'::text])))
);

ALTER TABLE "public"."group_memberships"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."library_items" (
  "library_item_id" uuid    NOT NULL DEFAULT gen_random_uuid(),
  "condition"       text    NOT NULL,
  "is_available"    boolean NOT NULL DEFAULT true,
  "owner_user_id"   uuid    NOT NULL,
  "board_game_id"   uuid    NOT NULL,
  CONSTRAINT "library_items_pkey" PRIMARY KEY (library_item_id)
);

ALTER TABLE "public"."library_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."notifications" (
  "notification_id"      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "type"                 text                     NOT NULL,
  "message"              text                     NOT NULL,
  "is_read"              boolean                  NOT NULL DEFAULT false,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "user_id"              uuid                     NOT NULL,
  "related_offer_id"     uuid,
  "related_borrowing_id" uuid,
  CONSTRAINT "notifications_pkey" PRIMARY KEY (notification_id)
);

ALTER TABLE "public"."notifications"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."stores" (
  "store_id"    uuid NOT NULL DEFAULT gen_random_uuid(),
  "name"        text NOT NULL,
  "website_url" text,
  CONSTRAINT "stores_pkey" PRIMARY KEY (store_id)
);

ALTER TABLE "public"."stores"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."users" (
  "user_id"    uuid                     NOT NULL,
  "username"   text                     NOT NULL,
  "email"      text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_email_key" UNIQUE (email),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "profiles_username_key" UNIQUE (username)
);

ALTER TABLE "public"."users"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."wishlist_items" (
  "wishlist_item_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id"          uuid NOT NULL,
  "board_game_id"    uuid NOT NULL,
  CONSTRAINT "wishlist_items_pkey" PRIMARY KEY (wishlist_item_id),
  CONSTRAINT "wishlist_items_user_game_key" UNIQUE (user_id, board_game_id)
);

ALTER TABLE "public"."wishlist_items"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION public.search_users (
  search_term text
)
  RETURNS TABLE (
    user_id  uuid,
    username text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

REVOKE ALL ON FUNCTION "public"."search_users"(text) FROM PUBLIC, "anon", "service_role";

ALTER TABLE "public"."board_game_offers"
  ADD CONSTRAINT "board_game_offers_board_game_id_fkey" FOREIGN KEY (board_game_id) REFERENCES public.board_games(board_game_id) ON DELETE CASCADE;

ALTER TABLE "public"."group_memberships"
  ADD CONSTRAINT "group_memberships_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.community_groups(group_id) ON DELETE CASCADE;

ALTER TABLE "public"."library_items"
  ADD CONSTRAINT "library_items_board_game_id_fkey" FOREIGN KEY (board_game_id) REFERENCES public.board_games(board_game_id) ON DELETE RESTRICT;

ALTER TABLE "public"."borrowing_records"
  ADD CONSTRAINT "borrowing_records_library_item_id_fkey" FOREIGN KEY (library_item_id) REFERENCES public.library_items(library_item_id) ON DELETE RESTRICT;

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_related_borrowing_id_fkey" FOREIGN KEY (related_borrowing_id) REFERENCES public.borrowing_records(borrowing_id) ON DELETE SET NULL;

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_related_offer_id_fkey" FOREIGN KEY (related_offer_id) REFERENCES public.board_game_offers(offer_id) ON DELETE SET NULL;

ALTER TABLE "public"."board_game_offers"
  ADD CONSTRAINT "board_game_offers_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(store_id) ON DELETE CASCADE;

ALTER TABLE "public"."borrowing_records"
  ADD CONSTRAINT "borrowing_records_borrower_user_id_fkey" FOREIGN KEY (borrower_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."community_groups"
  ADD CONSTRAINT "community_groups_created_by_user_id_fkey" FOREIGN KEY (created_by_user_id) REFERENCES public.users(user_id) ON DELETE RESTRICT;

ALTER TABLE "public"."friendships"
  ADD CONSTRAINT "friendships_recipient_user_id_fkey" FOREIGN KEY (recipient_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."friendships"
  ADD CONSTRAINT "friendships_requester_user_id_fkey" FOREIGN KEY (requester_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."group_memberships"
  ADD CONSTRAINT "group_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."library_items"
  ADD CONSTRAINT "library_items_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE "public"."users"
  ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."wishlist_items"
  ADD CONSTRAINT "wishlist_items_board_game_id_fkey" FOREIGN KEY (board_game_id) REFERENCES public.board_games(board_game_id) ON DELETE CASCADE;

ALTER TABLE "public"."wishlist_items"
  ADD CONSTRAINT "wishlist_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

CREATE INDEX board_game_offers_board_game_id_idx ON public.board_game_offers USING btree (board_game_id);

CREATE INDEX board_game_offers_store_id_idx ON public.board_game_offers USING btree (store_id);

CREATE INDEX borrowing_records_borrower_user_id_idx ON public.borrowing_records USING btree (borrower_user_id);

CREATE INDEX borrowing_records_library_item_id_idx ON public.borrowing_records USING btree (library_item_id);

CREATE INDEX community_groups_created_by_user_id_idx ON public.community_groups USING btree (created_by_user_id);

CREATE INDEX friendships_recipient_user_id_idx ON public.friendships USING btree (recipient_user_id);

CREATE UNIQUE INDEX friendships_unordered_users_key ON public.friendships USING btree (LEAST(requester_user_id, recipient_user_id), GREATEST(requester_user_id, recipient_user_id));

CREATE INDEX group_memberships_user_id_idx ON public.group_memberships USING btree (user_id);

CREATE INDEX library_items_board_game_id_idx ON public.library_items USING btree (board_game_id);

CREATE INDEX library_items_owner_user_id_idx ON public.library_items USING btree (owner_user_id);

CREATE INDEX notifications_related_borrowing_id_idx ON public.notifications USING btree (related_borrowing_id);

CREATE INDEX notifications_related_offer_id_idx ON public.notifications USING btree (related_offer_id);

CREATE INDEX notifications_user_is_read_idx ON public.notifications USING btree (user_id, is_read);

CREATE INDEX wishlist_items_board_game_id_idx ON public.wishlist_items USING btree (board_game_id);

CREATE POLICY "Users can read own profile" ON "public"."users"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can update own profile" ON "public"."users"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

COMMENT ON TABLE "public"."board_game_offers" IS 'Retail pricing and product links for board games at stores.';

COMMENT ON TABLE "public"."board_games" IS 'Catalog of board games available in the Board Buddies community.';

COMMENT ON TABLE "public"."borrowing_records" IS 'Tracks user loans of library items, including due dates, returns, and status.';

COMMENT ON TABLE "public"."community_groups" IS 'Community groups created by Board Buddies users.';

COMMENT ON TABLE "public"."friendships" IS 'Friend requests and friendship state between two distinct users.';

COMMENT ON TABLE "public"."group_memberships" IS 'User membership requests and roles within community groups.';

COMMENT ON TABLE "public"."library_items" IS 'A board game copy owned by a user and potentially available to borrow.';

COMMENT ON TABLE "public"."notifications" IS 'User notifications optionally associated with an offer or borrowing record.';

COMMENT ON TABLE "public"."stores" IS 'Retail stores that provide board game offers.';

COMMENT ON TABLE "public"."wishlist_items" IS 'Board games saved to a user wishlist.';

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."search_users"(text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."search_users"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."search_users"(text) TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."board_game_offers" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."board_game_offers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."board_game_offers" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."board_game_offers" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."board_games" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."board_games" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."board_games" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."board_games" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."borrowing_records" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."borrowing_records" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."borrowing_records" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."borrowing_records" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."community_groups" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."community_groups" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."community_groups" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."community_groups" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."friendships" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."friendships" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."friendships" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."friendships" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."group_memberships" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."group_memberships" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."group_memberships" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."group_memberships" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."library_items" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."library_items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."library_items" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."library_items" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."notifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."stores" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."stores" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."stores" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."stores" TO "service_role";

REVOKE ALL ON TABLE "public"."users" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."users" TO "anon";

REVOKE ALL ON TABLE "public"."users" FROM "authenticated";

REVOKE ALL ("username") ON TABLE "public"."users" FROM "authenticated";

GRANT UPDATE ("username") ON TABLE "public"."users" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."users" TO "authenticated";

REVOKE ALL ON TABLE "public"."users" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."wishlist_items" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."wishlist_items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."wishlist_items" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."wishlist_items" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "service_role";

