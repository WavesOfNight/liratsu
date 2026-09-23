import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor', 'moderator');
  CREATE TYPE "public"."enum_products_fulfillment" AS ENUM('gelato', 'stock');
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_version_fulfillment" AS ENUM('gelato', 'stock');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded', 'failed');
  CREATE TYPE "public"."enum_orders_provider" AS ENUM('stripe', 'paypal');
  CREATE TYPE "public"."enum_coupons_type" AS ENUM('percent', 'fixed', 'freeShipping');
  CREATE TYPE "public"."enum_guestbook_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_guestbook_mood" AS ENUM('star', 'heart', 'fish', 'bubble', 'music');
  CREATE TYPE "public"."enum_fanarts_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_downloads_files_format" AS ENUM('phone', 'tablet', 'desktop', 'zip');
  CREATE TYPE "public"."enum_downloads_kind" AS ENUM('wallpaper', 'widget', 'emojis', 'other');
  CREATE TYPE "public"."enum_surprise_codes_source" AS ENUM('live', 'easterEgg', 'game', 'other');
  CREATE TYPE "public"."enum_legal_pages_slug" AS ENUM('mentions-legales', 'cgu', 'cgv', 'confidentialite', 'cookies');
  CREATE TYPE "public"."enum_legal_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__legal_pages_v_version_slug" AS ENUM('mentions-legales', 'cgu', 'cgv', 'confidentialite', 'cookies');
  CREATE TYPE "public"."enum__legal_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_site_settings_home_status" AS ENUM('on', 'off', 'soon');
  CREATE TYPE "public"."enum_site_settings_biography_status" AS ENUM('on', 'off', 'soon');
  CREATE TYPE "public"."enum_site_settings_community_status" AS ENUM('on', 'off', 'soon');
  CREATE TYPE "public"."enum_site_settings_shop_status" AS ENUM('on', 'off', 'soon');
  CREATE TYPE "public"."enum_site_settings_arcade_status" AS ENUM('on', 'off', 'soon');
  CREATE TYPE "public"."enum_site_settings_links_status" AS ENUM('on', 'off', 'soon');
  CREATE TYPE "public"."enum_theme_effects_default_mode" AS ENUM('auto', 'light', 'dark');
  CREATE TYPE "public"."enum_home_page_blocks_schedule_manual_day" AS ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche');
  CREATE TYPE "public"."enum_home_page_blocks_schedule_manual_kind" AS ENUM('game', 'art', 'music', 'chat');
  CREATE TYPE "public"."enum_home_page_blocks_schedule_source" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum_home_page_blocks_social_posts_posts_network" AS ENUM('instagram', 'tiktok');
  CREATE TYPE "public"."enum_home_page_blocks_image_style" AS ENUM('polaroid', 'window', 'full');
  CREATE TYPE "public"."enum__home_page_v_blocks_schedule_manual_day" AS ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche');
  CREATE TYPE "public"."enum__home_page_v_blocks_schedule_manual_kind" AS ENUM('game', 'art', 'music', 'chat');
  CREATE TYPE "public"."enum__home_page_v_blocks_schedule_source" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum__home_page_v_blocks_social_posts_posts_network" AS ENUM('instagram', 'tiktok');
  CREATE TYPE "public"."enum__home_page_v_blocks_image_style" AS ENUM('polaroid', 'window', 'full');
  CREATE TYPE "public"."enum_biography_page_blocks_image_style" AS ENUM('polaroid', 'window', 'full');
  CREATE TYPE "public"."enum_biography_page_blocks_timeline_events_icon" AS ENUM('star', 'bubble', 'heart', 'pencil', 'note', 'gamepad', 'fish');
  CREATE TYPE "public"."enum_biography_page_blocks_profile_card_presence" AS ENUM('online', 'busy', 'away');
  CREATE TYPE "public"."enum__biography_page_v_blocks_image_style" AS ENUM('polaroid', 'window', 'full');
  CREATE TYPE "public"."enum__biography_page_v_blocks_timeline_events_icon" AS ENUM('star', 'bubble', 'heart', 'pencil', 'note', 'gamepad', 'fish');
  CREATE TYPE "public"."enum__biography_page_v_blocks_profile_card_presence" AS ENUM('online', 'busy', 'away');
  CREATE TYPE "public"."enum_links_page_links_icon" AS ENUM('twitch', 'youtube', 'instagram', 'tiktok', 'discord', 'shop', 'star', 'bubble', 'heart', 'gamepad', 'mail');
  CREATE TYPE "public"."enum_links_page_links_color" AS ENUM('aero', 'lagoon', 'candy', 'lime', 'star', 'deep');
  CREATE TYPE "public"."enum__links_page_v_version_links_icon" AS ENUM('twitch', 'youtube', 'instagram', 'tiktok', 'discord', 'shop', 'star', 'bubble', 'heart', 'gamepad', 'mail');
  CREATE TYPE "public"."enum__links_page_v_version_links_color" AS ENUM('aero', 'lagoon', 'candy', 'lime', 'star', 'deep');
  CREATE TYPE "public"."enum_shop_settings_enabled_payments" AS ENUM('stripe', 'paypal');
  CREATE TYPE "public"."enum_shop_settings_currency" AS ENUM('EUR');
  CREATE TYPE "public"."enum_easter_eggs_secret_hint" AS ENUM('fishClicks', 'typeGlouglou');
  CREATE TYPE "public"."enum_game_settings_saac_unlocks_condition" AS ENUM('floor', 'score', 'win', 'daily');
  CREATE TYPE "public"."enum_game_settings_saac_difficulty" AS ENUM('easy', 'normal', 'hard');
  CREATE TYPE "public"."enum_integrations_analytics_provider" AS ENUM('none', 'umami', 'plausible');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"totp_enabled" boolean DEFAULT false,
  	"totp_enabled_at" timestamp(3) with time zone,
  	"totp_secret" varchar,
  	"totp_pending_secret" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_wide_url" varchar,
  	"sizes_wide_width" numeric,
  	"sizes_wide_height" numeric,
  	"sizes_wide_mime_type" varchar,
  	"sizes_wide_filesize" numeric,
  	"sizes_wide_filename" varchar
  );
  
  CREATE TABLE "products_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "products_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"sku" varchar,
  	"size" varchar,
  	"color" varchar,
  	"price" numeric,
  	"stock" numeric,
  	"gelato_product_uid" varchar,
  	"gelato_file_url" varchar
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"fulfillment" "enum_products_fulfillment" DEFAULT 'gelato',
  	"badge" varchar,
  	"short_description" varchar,
  	"description" jsonb,
  	"price" numeric,
  	"compare_at_price" numeric,
  	"vat_key" varchar DEFAULT 'standard',
  	"personalized" boolean,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_products_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "_products_v_version_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"sku" varchar,
  	"size" varchar,
  	"color" varchar,
  	"price" numeric,
  	"stock" numeric,
  	"gelato_product_uid" varchar,
  	"gelato_file_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_fulfillment" "enum__products_v_version_fulfillment" DEFAULT 'gelato',
  	"version_badge" varchar,
  	"version_short_description" varchar,
  	"version_description" jsonb,
  	"version_price" numeric,
  	"version_compare_at_price" numeric,
  	"version_vat_key" varchar DEFAULT 'standard',
  	"version_personalized" boolean,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__products_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_products_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"variant_label" varchar,
  	"sku" varchar,
  	"quantity" numeric,
  	"unit_price" numeric,
  	"discount" numeric,
  	"vat_rate" numeric,
  	"fulfillment" varchar,
  	"product_id" integer,
  	"gelato_product_uid" varchar,
  	"gelato_file_url" varchar
  );
  
  CREATE TABLE "orders_refunds" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"amount" numeric,
  	"reference" varchar,
  	"at" timestamp(3) with time zone,
  	"by" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'pending' NOT NULL,
  	"test_mode" boolean,
  	"email" varchar NOT NULL,
  	"customer_id" integer,
  	"provider" "enum_orders_provider" NOT NULL,
  	"provider_ref" varchar,
  	"payment_id" varchar,
  	"amounts_subtotal" numeric,
  	"amounts_discount" numeric,
  	"amounts_shipping" numeric,
  	"amounts_vat" numeric,
  	"amounts_vat_breakdown" jsonb,
  	"total" numeric,
  	"coupon_id" integer,
  	"coupon_code" varchar,
  	"shipping_zone_id" integer,
  	"shipping_address_first_name" varchar,
  	"shipping_address_last_name" varchar,
  	"shipping_address_line1" varchar,
  	"shipping_address_line2" varchar,
  	"shipping_address_postal_code" varchar,
  	"shipping_address_city" varchar,
  	"shipping_address_country" varchar,
  	"shipping_address_phone" varchar,
  	"fulfillment_gelato_order_id" varchar,
  	"fulfillment_gelato_status" varchar,
  	"fulfillment_gelato_error" varchar,
  	"fulfillment_carrier" varchar,
  	"fulfillment_tracking_number" varchar,
  	"fulfillment_tracking_url" varchar,
  	"invoice_number" varchar,
  	"paid_at" timestamp(3) with time zone,
  	"access_token" varchar,
  	"emails_sent" jsonb,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"name" varchar,
  	"phone" varchar,
  	"orders_count" numeric DEFAULT 0,
  	"total_spent" numeric DEFAULT 0,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "coupons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"batch" varchar,
  	"type" "enum_coupons_type" DEFAULT 'percent' NOT NULL,
  	"value" numeric DEFAULT 10,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"max_uses" numeric,
  	"max_uses_per_customer" numeric DEFAULT 1,
  	"min_amount" numeric,
  	"note" varchar,
  	"usage_count" numeric DEFAULT 0,
  	"revenue" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "coupons_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"categories_id" integer
  );
  
  CREATE TABLE "shipping_zones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"countries" varchar NOT NULL,
  	"base" numeric NOT NULL,
  	"per_extra_item" numeric DEFAULT 0,
  	"free_from" numeric,
  	"delay" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "guestbook" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_guestbook_status" DEFAULT 'pending' NOT NULL,
  	"name" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"mood" "enum_guestbook_mood" DEFAULT 'star',
  	"reply" varchar,
  	"ip_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "fanarts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_fanarts_status" DEFAULT 'pending' NOT NULL,
  	"title" varchar NOT NULL,
  	"artist" varchar NOT NULL,
  	"artist_link" varchar,
  	"license_accepted" boolean DEFAULT false NOT NULL,
  	"contact_email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar
  );
  
  CREATE TABLE "polls_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"votes" numeric DEFAULT 0
  );
  
  CREATE TABLE "polls" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"closes_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "poll_votes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"poll_id" integer NOT NULL,
  	"voter_hash" varchar NOT NULL,
  	"option" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "announcements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" jsonb,
  	"pinned" boolean,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "downloads_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"format" "enum_downloads_files_format" NOT NULL,
  	"file_id" integer NOT NULL
  );
  
  CREATE TABLE "downloads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum_downloads_kind" NOT NULL,
  	"preview_id" integer NOT NULL,
  	"locked" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "protected_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "surprise_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"source" "enum_surprise_codes_source" DEFAULT 'live',
  	"message" varchar DEFAULT 'Bravo, tu as trouvé une surprise !',
  	"active" boolean DEFAULT true,
  	"expires_at" timestamp(3) with time zone,
  	"redemptions" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "surprise_codes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"downloads_id" integer
  );
  
  CREATE TABLE "notify_signups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"section" varchar NOT NULL,
  	"consent_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"twitch_id" varchar NOT NULL,
  	"display_name" varchar NOT NULL,
  	"avatar_url" varchar,
  	"banned" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "members_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"surprise_codes_id" integer
  );
  
  CREATE TABLE "scores" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"game" varchar DEFAULT 'the-saac' NOT NULL,
  	"nickname" varchar NOT NULL,
  	"score" numeric NOT NULL,
  	"floor" numeric NOT NULL,
  	"won" boolean,
  	"duration_ms" numeric,
  	"seed" varchar,
  	"daily" boolean,
  	"hidden" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "game_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"game" varchar NOT NULL,
  	"seed" varchar NOT NULL,
  	"daily" boolean,
  	"started_at" timestamp(3) with time zone NOT NULL,
  	"used" boolean DEFAULT false,
  	"ip_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" "enum_legal_pages_slug",
  	"last_updated" timestamp(3) with time zone,
  	"show_identity" boolean DEFAULT false,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_legal_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_legal_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" "enum__legal_pages_v_version_slug",
  	"version_last_updated" timestamp(3) with time zone,
  	"version_show_identity" boolean DEFAULT false,
  	"version_content" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__legal_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "activity_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"summary" varchar NOT NULL,
  	"user_id" integer,
  	"entity" varchar,
  	"entity_id" varchar,
  	"operation" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "webhook_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" varchar NOT NULL,
  	"source" varchar NOT NULL,
  	"type" varchar,
  	"order_id" integer,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"products_id" integer,
  	"categories_id" integer,
  	"orders_id" integer,
  	"customers_id" integer,
  	"coupons_id" integer,
  	"shipping_zones_id" integer,
  	"guestbook_id" integer,
  	"fanarts_id" integer,
  	"polls_id" integer,
  	"poll_votes_id" integer,
  	"announcements_id" integer,
  	"downloads_id" integer,
  	"protected_files_id" integer,
  	"surprise_codes_id" integer,
  	"notify_signups_id" integer,
  	"members_id" integer,
  	"scores_id" integer,
  	"game_sessions_id" integer,
  	"legal_pages_id" integer,
  	"activity_log_id" integer,
  	"webhook_events_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'Liratsu' NOT NULL,
  	"site_url" varchar DEFAULT 'https://liratsu.fr' NOT NULL,
  	"tagline" varchar DEFAULT 'Dessin · Musique · Jeu vidéo',
  	"meta_description" varchar DEFAULT 'Site officiel de Liratsu, streameuse Twitch passionnée de dessin, de musique et de jeu vidéo : lives, biographie, espace communauté, boutique et mini-jeux.',
  	"og_image_id" integer,
  	"avatar_id" integer,
  	"twitch" varchar DEFAULT 'https://www.twitch.tv/liratsu',
  	"youtube" varchar,
  	"instagram" varchar DEFAULT 'https://www.instagram.com/liratsu/',
  	"tiktok" varchar DEFAULT 'https://www.tiktok.com/@liratsu_',
  	"discord" varchar DEFAULT 'https://discord.gg/aHWbGZH6g2',
  	"home_status" "enum_site_settings_home_status" DEFAULT 'on' NOT NULL,
  	"home_show_in_menu" boolean DEFAULT true,
  	"home_menu_label" varchar DEFAULT 'Accueil',
  	"home_teaser_text" varchar,
  	"home_notify_form" boolean DEFAULT true,
  	"biography_status" "enum_site_settings_biography_status" DEFAULT 'on' NOT NULL,
  	"biography_show_in_menu" boolean DEFAULT true,
  	"biography_menu_label" varchar DEFAULT 'Biographie',
  	"biography_teaser_text" varchar,
  	"biography_notify_form" boolean DEFAULT true,
  	"community_status" "enum_site_settings_community_status" DEFAULT 'soon' NOT NULL,
  	"community_show_in_menu" boolean DEFAULT true,
  	"community_menu_label" varchar DEFAULT 'Espace communauté',
  	"community_teaser_text" varchar,
  	"community_notify_form" boolean DEFAULT true,
  	"shop_status" "enum_site_settings_shop_status" DEFAULT 'soon' NOT NULL,
  	"shop_show_in_menu" boolean DEFAULT true,
  	"shop_menu_label" varchar DEFAULT 'Boutique',
  	"shop_teaser_text" varchar,
  	"shop_notify_form" boolean DEFAULT true,
  	"arcade_status" "enum_site_settings_arcade_status" DEFAULT 'on' NOT NULL,
  	"arcade_show_in_menu" boolean DEFAULT true,
  	"arcade_menu_label" varchar DEFAULT 'Arcade / mini-jeux',
  	"arcade_teaser_text" varchar,
  	"arcade_notify_form" boolean DEFAULT true,
  	"links_status" "enum_site_settings_links_status" DEFAULT 'on' NOT NULL,
  	"links_show_in_menu" boolean DEFAULT true,
  	"links_menu_label" varchar DEFAULT 'Liens',
  	"links_teaser_text" varchar,
  	"links_notify_form" boolean DEFAULT true,
  	"footer_text" varchar DEFAULT '© Liratsu · Fait avec des bulles',
  	"dev_credit" varchar DEFAULT 'Codé par El Technico Lionel',
  	"publisher_credit" varchar DEFAULT 'Site édité par Reads Records',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "theme" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"palette_aero" varchar DEFAULT '#3FA9F5',
  	"palette_deep" varchar DEFAULT '#1E6FD9',
  	"palette_lagoon" varchar DEFAULT '#2EC4C9',
  	"palette_candy" varchar DEFAULT '#FF7EB6',
  	"palette_lime" varchar DEFAULT '#9BE15D',
  	"palette_star" varchar DEFAULT '#FFD35C',
  	"palette_ink" varchar DEFAULT '#1B2240',
  	"palette_cloud" varchar DEFAULT '#F4F8FF',
  	"effects_bubbles" boolean DEFAULT true,
  	"effects_fish" boolean DEFAULT true,
  	"effects_sounds_available" boolean DEFAULT true,
  	"effects_custom_cursors" boolean DEFAULT false,
  	"effects_default_mode" "enum_theme_effects_default_mode" DEFAULT 'auto',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tagline" varchar DEFAULT 'Dessin · Musique · Jeu vidéo',
  	"intro" varchar,
  	"cta_label" varchar DEFAULT 'Regarder le live',
  	"cta_url" varchar DEFAULT 'https://www.twitch.tv/liratsu',
  	"show_avatar" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_live_status" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"show_player" boolean DEFAULT true,
  	"offline_text" varchar DEFAULT 'Liratsu n’est pas en live pour le moment… viens faire un tour sur le planning !',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_schedule_manual" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "enum_home_page_blocks_schedule_manual_day" NOT NULL,
  	"time" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum_home_page_blocks_schedule_manual_kind" DEFAULT 'game'
  );
  
  CREATE TABLE "home_page_blocks_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"source" "enum_home_page_blocks_schedule_source" DEFAULT 'auto',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_clips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"count" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_youtube" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"count" numeric DEFAULT 4,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_social_posts_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"network" "enum_home_page_blocks_social_posts_posts_network" NOT NULL,
  	"url" varchar NOT NULL,
  	"thumbnail_id" integer NOT NULL,
  	"caption" varchar
  );
  
  CREATE TABLE "home_page_blocks_social_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_social_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_community_goal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"label" varchar DEFAULT 'Objectif subs' NOT NULL,
  	"current" numeric DEFAULT 0 NOT NULL,
  	"target" numeric DEFAULT 100 NOT NULL,
  	"reward" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"content" jsonb NOT NULL,
  	"plain" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"style" "enum_home_page_blocks_image_style" DEFAULT 'polaroid',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_home_page_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tagline" varchar DEFAULT 'Dessin · Musique · Jeu vidéo',
  	"intro" varchar,
  	"cta_label" varchar DEFAULT 'Regarder le live',
  	"cta_url" varchar DEFAULT 'https://www.twitch.tv/liratsu',
  	"show_avatar" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_live_status" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"show_player" boolean DEFAULT true,
  	"offline_text" varchar DEFAULT 'Liratsu n’est pas en live pour le moment… viens faire un tour sur le planning !',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_schedule_manual" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"day" "enum__home_page_v_blocks_schedule_manual_day" NOT NULL,
  	"time" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum__home_page_v_blocks_schedule_manual_kind" DEFAULT 'game',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"source" "enum__home_page_v_blocks_schedule_source" DEFAULT 'auto',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_clips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"count" numeric DEFAULT 6,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_youtube" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"count" numeric DEFAULT 4,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_social_posts_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"network" "enum__home_page_v_blocks_social_posts_posts_network" NOT NULL,
  	"url" varchar NOT NULL,
  	"thumbnail_id" integer NOT NULL,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_social_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_social_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_community_goal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"label" varchar DEFAULT 'Objectif subs' NOT NULL,
  	"current" numeric DEFAULT 0 NOT NULL,
  	"target" numeric DEFAULT 100 NOT NULL,
  	"reward" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"content" jsonb NOT NULL,
  	"plain" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_home_page_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"style" "enum__home_page_v_blocks_image_style" DEFAULT 'polaroid',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "biography_page_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"content" jsonb NOT NULL,
  	"plain" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "biography_page_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"style" "enum_biography_page_blocks_image_style" DEFAULT 'polaroid',
  	"block_name" varchar
  );
  
  CREATE TABLE "biography_page_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar
  );
  
  CREATE TABLE "biography_page_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "biography_page_blocks_timeline_events" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" varchar NOT NULL,
  	"icon" "enum_biography_page_blocks_timeline_events_icon" DEFAULT 'star',
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "biography_page_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "biography_page_blocks_profile_card_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "biography_page_blocks_profile_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"display_name" varchar DEFAULT '✿ Liratsu ✿',
  	"mood" varchar DEFAULT 'en train de dessiner avec un lo-fi dans les oreilles ♪',
  	"presence" "enum_biography_page_blocks_profile_card_presence" DEFAULT 'online',
  	"avatar_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "biography_page_blocks_community_goal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"label" varchar DEFAULT 'Objectif subs' NOT NULL,
  	"current" numeric DEFAULT 0 NOT NULL,
  	"target" numeric DEFAULT 100 NOT NULL,
  	"reward" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "biography_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Biographie',
  	"intro" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_biography_page_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"content" jsonb NOT NULL,
  	"plain" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_biography_page_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"style" "enum__biography_page_v_blocks_image_style" DEFAULT 'polaroid',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_biography_page_v_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_biography_page_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_biography_page_v_blocks_timeline_events" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar NOT NULL,
  	"icon" "enum__biography_page_v_blocks_timeline_events_icon" DEFAULT 'star',
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_biography_page_v_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_biography_page_v_blocks_profile_card_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_biography_page_v_blocks_profile_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"display_name" varchar DEFAULT '✿ Liratsu ✿',
  	"mood" varchar DEFAULT 'en train de dessiner avec un lo-fi dans les oreilles ♪',
  	"presence" "enum__biography_page_v_blocks_profile_card_presence" DEFAULT 'online',
  	"avatar_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_biography_page_v_blocks_community_goal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"window_title" varchar,
  	"label" varchar DEFAULT 'Objectif subs' NOT NULL,
  	"current" numeric DEFAULT 0 NOT NULL,
  	"target" numeric DEFAULT 100 NOT NULL,
  	"reward" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_biography_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar DEFAULT 'Biographie',
  	"version_intro" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "links_page_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"icon" "enum_links_page_links_icon" DEFAULT 'star',
  	"color" "enum_links_page_links_color" DEFAULT 'aero',
  	"highlight" boolean
  );
  
  CREATE TABLE "links_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Tous mes liens',
  	"subtitle" varchar DEFAULT 'Viens dire coucou partout ✦',
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_links_page_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"icon" "enum__links_page_v_version_links_icon" DEFAULT 'star',
  	"color" "enum__links_page_v_version_links_color" DEFAULT 'aero',
  	"highlight" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_links_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar DEFAULT 'Tous mes liens',
  	"version_subtitle" varchar DEFAULT 'Viens dire coucou partout ✦',
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shop_settings_vat_rates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"rate" numeric NOT NULL
  );
  
  CREATE TABLE "shop_settings_enabled_payments" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_shop_settings_enabled_payments",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "shop_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"test_mode" boolean DEFAULT true,
  	"currency" "enum_shop_settings_currency" DEFAULT 'EUR',
  	"invoice_issuer_name" varchar DEFAULT 'Reads Records',
  	"invoice_issuer_details" varchar,
  	"invoice_prefix" varchar DEFAULT 'LIR',
  	"invoice_footer" varchar DEFAULT 'Merci pour ton soutien ! Boutique officielle Liratsu, éditée par Reads Records.',
  	"free_shipping_threshold" numeric DEFAULT 0,
  	"checkout_notice" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "easter_eggs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"konami" boolean DEFAULT true,
  	"logo_pop" boolean DEFAULT true,
  	"window_close" boolean DEFAULT true,
  	"wizz" boolean DEFAULT true,
  	"footer_credit" boolean DEFAULT true,
  	"console" boolean DEFAULT true,
  	"aquarium404" boolean DEFAULT true,
  	"secret_code" boolean DEFAULT true,
  	"secret_hint" "enum_easter_eggs_secret_hint" DEFAULT 'fishClicks',
  	"secret_reward_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "game_settings_saac_unlocks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"condition" "enum_game_settings_saac_unlocks_condition" NOT NULL,
  	"threshold" numeric DEFAULT 1,
  	"reward_id" integer NOT NULL,
  	"message" varchar
  );
  
  CREATE TABLE "game_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"saac_enabled" boolean DEFAULT true,
  	"saac_leaderboard_enabled" boolean DEFAULT true,
  	"saac_difficulty" "enum_game_settings_saac_difficulty" DEFAULT 'normal',
  	"saac_start_hearts" numeric DEFAULT 3,
  	"saac_floors" numeric DEFAULT 5,
  	"saac_max_score_per_second" numeric DEFAULT 60,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "legal_identity" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"editeur_nom" varchar DEFAULT 'Reads Records',
  	"editeur_forme" varchar DEFAULT 'SARL',
  	"editeur_capital" varchar,
  	"editeur_siege" varchar,
  	"editeur_rcs" varchar,
  	"editeur_siren" varchar,
  	"editeur_tva" varchar,
  	"editeur_directeur" varchar,
  	"editeur_email" varchar,
  	"editeur_telephone" varchar,
  	"editeur_site" varchar DEFAULT 'https://reads-records.com/',
  	"hebergeur_nom" varchar DEFAULT 'IONOS SARL',
  	"hebergeur_adresse" varchar DEFAULT '[À VÉRIFIER]',
  	"hebergeur_telephone" varchar DEFAULT '[À VÉRIFIER]',
  	"hebergeur_site" varchar DEFAULT 'https://www.ionos.fr',
  	"mediateur_nom" varchar DEFAULT '[À RENSEIGNER]',
  	"mediateur_site" varchar DEFAULT '[À RENSEIGNER]',
  	"dpo_email" varchar,
  	"developpeur" varchar DEFAULT 'Site conçu et développé par El Technico Lionel',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_legal_identity_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_editeur_nom" varchar DEFAULT 'Reads Records',
  	"version_editeur_forme" varchar DEFAULT 'SARL',
  	"version_editeur_capital" varchar,
  	"version_editeur_siege" varchar,
  	"version_editeur_rcs" varchar,
  	"version_editeur_siren" varchar,
  	"version_editeur_tva" varchar,
  	"version_editeur_directeur" varchar,
  	"version_editeur_email" varchar,
  	"version_editeur_telephone" varchar,
  	"version_editeur_site" varchar DEFAULT 'https://reads-records.com/',
  	"version_hebergeur_nom" varchar DEFAULT 'IONOS SARL',
  	"version_hebergeur_adresse" varchar DEFAULT '[À VÉRIFIER]',
  	"version_hebergeur_telephone" varchar DEFAULT '[À VÉRIFIER]',
  	"version_hebergeur_site" varchar DEFAULT 'https://www.ionos.fr',
  	"version_mediateur_nom" varchar DEFAULT '[À RENSEIGNER]',
  	"version_mediateur_site" varchar DEFAULT '[À RENSEIGNER]',
  	"version_dpo_email" varchar,
  	"version_developpeur" varchar DEFAULT 'Site conçu et développé par El Technico Lionel',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "integrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"twitch_channel_login" varchar DEFAULT 'liratsu',
  	"twitch_client_id" varchar,
  	"twitch_client_secret" varchar,
  	"twitch_oauth_enabled" boolean DEFAULT false,
  	"youtube_channel_id" varchar,
  	"stripe_test_publishable_key" varchar,
  	"stripe_test_secret_key" varchar,
  	"stripe_test_webhook_secret" varchar,
  	"stripe_live_publishable_key" varchar,
  	"stripe_live_secret_key" varchar,
  	"stripe_live_webhook_secret" varchar,
  	"paypal_sandbox_client_id" varchar,
  	"paypal_sandbox_client_secret" varchar,
  	"paypal_sandbox_webhook_id" varchar,
  	"paypal_live_client_id" varchar,
  	"paypal_live_client_secret" varchar,
  	"paypal_live_webhook_id" varchar,
  	"gelato_api_key" varchar,
  	"gelato_webhook_token" varchar,
  	"smtp_host" varchar,
  	"smtp_port" numeric DEFAULT 587,
  	"smtp_secure" boolean,
  	"smtp_user" varchar,
  	"smtp_password" varchar,
  	"smtp_from" varchar DEFAULT 'Liratsu <boutique@liratsu.fr>',
  	"smtp_admin_notify" varchar,
  	"analytics_provider" "enum_integrations_analytics_provider" DEFAULT 'none',
  	"analytics_script_url" varchar,
  	"analytics_site_id" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_images" ADD CONSTRAINT "products_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_images" ADD CONSTRAINT "products_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_images" ADD CONSTRAINT "_products_v_version_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_images" ADD CONSTRAINT "_products_v_version_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_variants" ADD CONSTRAINT "_products_v_version_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_refunds" ADD CONSTRAINT "orders_refunds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_zone_id_shipping_zones_id_fk" FOREIGN KEY ("shipping_zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "polls_options" ADD CONSTRAINT "polls_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "downloads_files" ADD CONSTRAINT "downloads_files_file_id_protected_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."protected_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "downloads_files" ADD CONSTRAINT "downloads_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "downloads" ADD CONSTRAINT "downloads_preview_id_media_id_fk" FOREIGN KEY ("preview_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "surprise_codes_rels" ADD CONSTRAINT "surprise_codes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."surprise_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "surprise_codes_rels" ADD CONSTRAINT "surprise_codes_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "public"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "members_rels" ADD CONSTRAINT "members_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "members_rels" ADD CONSTRAINT "members_rels_surprise_codes_fk" FOREIGN KEY ("surprise_codes_id") REFERENCES "public"."surprise_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_legal_pages_v" ADD CONSTRAINT "_legal_pages_v_parent_id_legal_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupons_fk" FOREIGN KEY ("coupons_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shipping_zones_fk" FOREIGN KEY ("shipping_zones_id") REFERENCES "public"."shipping_zones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guestbook_fk" FOREIGN KEY ("guestbook_id") REFERENCES "public"."guestbook"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fanarts_fk" FOREIGN KEY ("fanarts_id") REFERENCES "public"."fanarts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_polls_fk" FOREIGN KEY ("polls_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_poll_votes_fk" FOREIGN KEY ("poll_votes_id") REFERENCES "public"."poll_votes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_announcements_fk" FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_downloads_fk" FOREIGN KEY ("downloads_id") REFERENCES "public"."downloads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_protected_files_fk" FOREIGN KEY ("protected_files_id") REFERENCES "public"."protected_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_surprise_codes_fk" FOREIGN KEY ("surprise_codes_id") REFERENCES "public"."surprise_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notify_signups_fk" FOREIGN KEY ("notify_signups_id") REFERENCES "public"."notify_signups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_scores_fk" FOREIGN KEY ("scores_id") REFERENCES "public"."scores"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_game_sessions_fk" FOREIGN KEY ("game_sessions_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_legal_pages_fk" FOREIGN KEY ("legal_pages_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activity_log_fk" FOREIGN KEY ("activity_log_id") REFERENCES "public"."activity_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_webhook_events_fk" FOREIGN KEY ("webhook_events_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_blocks_hero" ADD CONSTRAINT "home_page_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_live_status" ADD CONSTRAINT "home_page_blocks_live_status_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_schedule_manual" ADD CONSTRAINT "home_page_blocks_schedule_manual_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_blocks_schedule"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_schedule" ADD CONSTRAINT "home_page_blocks_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_clips" ADD CONSTRAINT "home_page_blocks_clips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_youtube" ADD CONSTRAINT "home_page_blocks_youtube_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_social_posts_posts" ADD CONSTRAINT "home_page_blocks_social_posts_posts_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_blocks_social_posts_posts" ADD CONSTRAINT "home_page_blocks_social_posts_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_blocks_social_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_social_posts" ADD CONSTRAINT "home_page_blocks_social_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_social_grid" ADD CONSTRAINT "home_page_blocks_social_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_community_goal" ADD CONSTRAINT "home_page_blocks_community_goal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_rich_text" ADD CONSTRAINT "home_page_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_image" ADD CONSTRAINT "home_page_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_blocks_image" ADD CONSTRAINT "home_page_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_hero" ADD CONSTRAINT "_home_page_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_live_status" ADD CONSTRAINT "_home_page_v_blocks_live_status_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_schedule_manual" ADD CONSTRAINT "_home_page_v_blocks_schedule_manual_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_blocks_schedule"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_schedule" ADD CONSTRAINT "_home_page_v_blocks_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_clips" ADD CONSTRAINT "_home_page_v_blocks_clips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_youtube" ADD CONSTRAINT "_home_page_v_blocks_youtube_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_social_posts_posts" ADD CONSTRAINT "_home_page_v_blocks_social_posts_posts_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_social_posts_posts" ADD CONSTRAINT "_home_page_v_blocks_social_posts_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_blocks_social_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_social_posts" ADD CONSTRAINT "_home_page_v_blocks_social_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_social_grid" ADD CONSTRAINT "_home_page_v_blocks_social_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_community_goal" ADD CONSTRAINT "_home_page_v_blocks_community_goal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_rich_text" ADD CONSTRAINT "_home_page_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_image" ADD CONSTRAINT "_home_page_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_image" ADD CONSTRAINT "_home_page_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_rich_text" ADD CONSTRAINT "biography_page_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."biography_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_image" ADD CONSTRAINT "biography_page_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_image" ADD CONSTRAINT "biography_page_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."biography_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_gallery_images" ADD CONSTRAINT "biography_page_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_gallery_images" ADD CONSTRAINT "biography_page_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."biography_page_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_gallery" ADD CONSTRAINT "biography_page_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."biography_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_timeline_events" ADD CONSTRAINT "biography_page_blocks_timeline_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."biography_page_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_timeline" ADD CONSTRAINT "biography_page_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."biography_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_profile_card_facts" ADD CONSTRAINT "biography_page_blocks_profile_card_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."biography_page_blocks_profile_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_profile_card" ADD CONSTRAINT "biography_page_blocks_profile_card_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_profile_card" ADD CONSTRAINT "biography_page_blocks_profile_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."biography_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "biography_page_blocks_community_goal" ADD CONSTRAINT "biography_page_blocks_community_goal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."biography_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "biography_page" ADD CONSTRAINT "biography_page_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_rich_text" ADD CONSTRAINT "_biography_page_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_biography_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_image" ADD CONSTRAINT "_biography_page_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_image" ADD CONSTRAINT "_biography_page_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_biography_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_gallery_images" ADD CONSTRAINT "_biography_page_v_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_gallery_images" ADD CONSTRAINT "_biography_page_v_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_biography_page_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_gallery" ADD CONSTRAINT "_biography_page_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_biography_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_timeline_events" ADD CONSTRAINT "_biography_page_v_blocks_timeline_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_biography_page_v_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_timeline" ADD CONSTRAINT "_biography_page_v_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_biography_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_profile_card_facts" ADD CONSTRAINT "_biography_page_v_blocks_profile_card_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_biography_page_v_blocks_profile_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_profile_card" ADD CONSTRAINT "_biography_page_v_blocks_profile_card_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_profile_card" ADD CONSTRAINT "_biography_page_v_blocks_profile_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_biography_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_biography_page_v_blocks_community_goal" ADD CONSTRAINT "_biography_page_v_blocks_community_goal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_biography_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_biography_page_v" ADD CONSTRAINT "_biography_page_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "links_page_links" ADD CONSTRAINT "links_page_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."links_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "links_page" ADD CONSTRAINT "links_page_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_links_page_v_version_links" ADD CONSTRAINT "_links_page_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_links_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_links_page_v" ADD CONSTRAINT "_links_page_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_settings_vat_rates" ADD CONSTRAINT "shop_settings_vat_rates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shop_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shop_settings_enabled_payments" ADD CONSTRAINT "shop_settings_enabled_payments_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."shop_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "easter_eggs" ADD CONSTRAINT "easter_eggs_secret_reward_id_surprise_codes_id_fk" FOREIGN KEY ("secret_reward_id") REFERENCES "public"."surprise_codes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "game_settings_saac_unlocks" ADD CONSTRAINT "game_settings_saac_unlocks_reward_id_surprise_codes_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."surprise_codes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "game_settings_saac_unlocks" ADD CONSTRAINT "game_settings_saac_unlocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."game_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_wide_sizes_wide_filename_idx" ON "media" USING btree ("sizes_wide_filename");
  CREATE INDEX "products_images_order_idx" ON "products_images" USING btree ("_order");
  CREATE INDEX "products_images_parent_id_idx" ON "products_images" USING btree ("_parent_id");
  CREATE INDEX "products_images_image_idx" ON "products_images" USING btree ("image_id");
  CREATE INDEX "products_variants_order_idx" ON "products_variants" USING btree ("_order");
  CREATE INDEX "products_variants_parent_id_idx" ON "products_variants" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products__status_idx" ON "products" USING btree ("_status");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_categories_id_idx" ON "products_rels" USING btree ("categories_id");
  CREATE INDEX "_products_v_version_images_order_idx" ON "_products_v_version_images" USING btree ("_order");
  CREATE INDEX "_products_v_version_images_parent_id_idx" ON "_products_v_version_images" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_images_image_idx" ON "_products_v_version_images" USING btree ("image_id");
  CREATE INDEX "_products_v_version_variants_order_idx" ON "_products_v_version_variants" USING btree ("_order");
  CREATE INDEX "_products_v_version_variants_parent_id_idx" ON "_products_v_version_variants" USING btree ("_parent_id");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v" USING btree ("version_slug");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_version_version__status_idx" ON "_products_v" USING btree ("version__status");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_latest_idx" ON "_products_v" USING btree ("latest");
  CREATE INDEX "_products_v_rels_order_idx" ON "_products_v_rels" USING btree ("order");
  CREATE INDEX "_products_v_rels_parent_idx" ON "_products_v_rels" USING btree ("parent_id");
  CREATE INDEX "_products_v_rels_path_idx" ON "_products_v_rels" USING btree ("path");
  CREATE INDEX "_products_v_rels_categories_id_idx" ON "_products_v_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE INDEX "orders_refunds_order_idx" ON "orders_refunds" USING btree ("_order");
  CREATE INDEX "orders_refunds_parent_id_idx" ON "orders_refunds" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "orders_number_idx" ON "orders" USING btree ("number");
  CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
  CREATE INDEX "orders_email_idx" ON "orders" USING btree ("email");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "orders_provider_ref_idx" ON "orders" USING btree ("provider_ref");
  CREATE INDEX "orders_coupon_idx" ON "orders" USING btree ("coupon_id");
  CREATE INDEX "orders_shipping_zone_idx" ON "orders" USING btree ("shipping_zone_id");
  CREATE UNIQUE INDEX "orders_invoice_number_idx" ON "orders" USING btree ("invoice_number");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "customers_email_idx" ON "customers" USING btree ("email");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");
  CREATE INDEX "coupons_batch_idx" ON "coupons" USING btree ("batch");
  CREATE INDEX "coupons_updated_at_idx" ON "coupons" USING btree ("updated_at");
  CREATE INDEX "coupons_created_at_idx" ON "coupons" USING btree ("created_at");
  CREATE INDEX "coupons_rels_order_idx" ON "coupons_rels" USING btree ("order");
  CREATE INDEX "coupons_rels_parent_idx" ON "coupons_rels" USING btree ("parent_id");
  CREATE INDEX "coupons_rels_path_idx" ON "coupons_rels" USING btree ("path");
  CREATE INDEX "coupons_rels_products_id_idx" ON "coupons_rels" USING btree ("products_id");
  CREATE INDEX "coupons_rels_categories_id_idx" ON "coupons_rels" USING btree ("categories_id");
  CREATE INDEX "shipping_zones_updated_at_idx" ON "shipping_zones" USING btree ("updated_at");
  CREATE INDEX "shipping_zones_created_at_idx" ON "shipping_zones" USING btree ("created_at");
  CREATE INDEX "guestbook_status_idx" ON "guestbook" USING btree ("status");
  CREATE INDEX "guestbook_updated_at_idx" ON "guestbook" USING btree ("updated_at");
  CREATE INDEX "guestbook_created_at_idx" ON "guestbook" USING btree ("created_at");
  CREATE INDEX "fanarts_status_idx" ON "fanarts" USING btree ("status");
  CREATE INDEX "fanarts_updated_at_idx" ON "fanarts" USING btree ("updated_at");
  CREATE INDEX "fanarts_created_at_idx" ON "fanarts" USING btree ("created_at");
  CREATE UNIQUE INDEX "fanarts_filename_idx" ON "fanarts" USING btree ("filename");
  CREATE INDEX "fanarts_sizes_thumb_sizes_thumb_filename_idx" ON "fanarts" USING btree ("sizes_thumb_filename");
  CREATE INDEX "polls_options_order_idx" ON "polls_options" USING btree ("_order");
  CREATE INDEX "polls_options_parent_id_idx" ON "polls_options" USING btree ("_parent_id");
  CREATE INDEX "polls_updated_at_idx" ON "polls" USING btree ("updated_at");
  CREATE INDEX "polls_created_at_idx" ON "polls" USING btree ("created_at");
  CREATE INDEX "poll_votes_poll_idx" ON "poll_votes" USING btree ("poll_id");
  CREATE INDEX "poll_votes_updated_at_idx" ON "poll_votes" USING btree ("updated_at");
  CREATE INDEX "poll_votes_created_at_idx" ON "poll_votes" USING btree ("created_at");
  CREATE UNIQUE INDEX "poll_voterHash_idx" ON "poll_votes" USING btree ("poll_id","voter_hash");
  CREATE INDEX "announcements_updated_at_idx" ON "announcements" USING btree ("updated_at");
  CREATE INDEX "announcements_created_at_idx" ON "announcements" USING btree ("created_at");
  CREATE INDEX "downloads_files_order_idx" ON "downloads_files" USING btree ("_order");
  CREATE INDEX "downloads_files_parent_id_idx" ON "downloads_files" USING btree ("_parent_id");
  CREATE INDEX "downloads_files_file_idx" ON "downloads_files" USING btree ("file_id");
  CREATE INDEX "downloads_preview_idx" ON "downloads" USING btree ("preview_id");
  CREATE INDEX "downloads_updated_at_idx" ON "downloads" USING btree ("updated_at");
  CREATE INDEX "downloads_created_at_idx" ON "downloads" USING btree ("created_at");
  CREATE INDEX "protected_files_updated_at_idx" ON "protected_files" USING btree ("updated_at");
  CREATE INDEX "protected_files_created_at_idx" ON "protected_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "protected_files_filename_idx" ON "protected_files" USING btree ("filename");
  CREATE UNIQUE INDEX "surprise_codes_code_idx" ON "surprise_codes" USING btree ("code");
  CREATE INDEX "surprise_codes_updated_at_idx" ON "surprise_codes" USING btree ("updated_at");
  CREATE INDEX "surprise_codes_created_at_idx" ON "surprise_codes" USING btree ("created_at");
  CREATE INDEX "surprise_codes_rels_order_idx" ON "surprise_codes_rels" USING btree ("order");
  CREATE INDEX "surprise_codes_rels_parent_idx" ON "surprise_codes_rels" USING btree ("parent_id");
  CREATE INDEX "surprise_codes_rels_path_idx" ON "surprise_codes_rels" USING btree ("path");
  CREATE INDEX "surprise_codes_rels_downloads_id_idx" ON "surprise_codes_rels" USING btree ("downloads_id");
  CREATE INDEX "notify_signups_updated_at_idx" ON "notify_signups" USING btree ("updated_at");
  CREATE INDEX "notify_signups_created_at_idx" ON "notify_signups" USING btree ("created_at");
  CREATE UNIQUE INDEX "members_twitch_id_idx" ON "members" USING btree ("twitch_id");
  CREATE INDEX "members_updated_at_idx" ON "members" USING btree ("updated_at");
  CREATE INDEX "members_created_at_idx" ON "members" USING btree ("created_at");
  CREATE INDEX "members_rels_order_idx" ON "members_rels" USING btree ("order");
  CREATE INDEX "members_rels_parent_idx" ON "members_rels" USING btree ("parent_id");
  CREATE INDEX "members_rels_path_idx" ON "members_rels" USING btree ("path");
  CREATE INDEX "members_rels_surprise_codes_id_idx" ON "members_rels" USING btree ("surprise_codes_id");
  CREATE INDEX "scores_game_idx" ON "scores" USING btree ("game");
  CREATE INDEX "scores_score_idx" ON "scores" USING btree ("score");
  CREATE INDEX "scores_daily_idx" ON "scores" USING btree ("daily");
  CREATE INDEX "scores_updated_at_idx" ON "scores" USING btree ("updated_at");
  CREATE INDEX "scores_created_at_idx" ON "scores" USING btree ("created_at");
  CREATE INDEX "game_sessions_updated_at_idx" ON "game_sessions" USING btree ("updated_at");
  CREATE INDEX "game_sessions_created_at_idx" ON "game_sessions" USING btree ("created_at");
  CREATE UNIQUE INDEX "legal_pages_slug_idx" ON "legal_pages" USING btree ("slug");
  CREATE INDEX "legal_pages_updated_at_idx" ON "legal_pages" USING btree ("updated_at");
  CREATE INDEX "legal_pages_created_at_idx" ON "legal_pages" USING btree ("created_at");
  CREATE INDEX "legal_pages__status_idx" ON "legal_pages" USING btree ("_status");
  CREATE INDEX "_legal_pages_v_parent_idx" ON "_legal_pages_v" USING btree ("parent_id");
  CREATE INDEX "_legal_pages_v_version_version_slug_idx" ON "_legal_pages_v" USING btree ("version_slug");
  CREATE INDEX "_legal_pages_v_version_version_updated_at_idx" ON "_legal_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_legal_pages_v_version_version_created_at_idx" ON "_legal_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_legal_pages_v_version_version__status_idx" ON "_legal_pages_v" USING btree ("version__status");
  CREATE INDEX "_legal_pages_v_created_at_idx" ON "_legal_pages_v" USING btree ("created_at");
  CREATE INDEX "_legal_pages_v_updated_at_idx" ON "_legal_pages_v" USING btree ("updated_at");
  CREATE INDEX "_legal_pages_v_latest_idx" ON "_legal_pages_v" USING btree ("latest");
  CREATE INDEX "activity_log_user_idx" ON "activity_log" USING btree ("user_id");
  CREATE INDEX "activity_log_updated_at_idx" ON "activity_log" USING btree ("updated_at");
  CREATE INDEX "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");
  CREATE UNIQUE INDEX "webhook_events_event_id_idx" ON "webhook_events" USING btree ("event_id");
  CREATE INDEX "webhook_events_order_idx" ON "webhook_events" USING btree ("order_id");
  CREATE INDEX "webhook_events_updated_at_idx" ON "webhook_events" USING btree ("updated_at");
  CREATE INDEX "webhook_events_created_at_idx" ON "webhook_events" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_coupons_id_idx" ON "payload_locked_documents_rels" USING btree ("coupons_id");
  CREATE INDEX "payload_locked_documents_rels_shipping_zones_id_idx" ON "payload_locked_documents_rels" USING btree ("shipping_zones_id");
  CREATE INDEX "payload_locked_documents_rels_guestbook_id_idx" ON "payload_locked_documents_rels" USING btree ("guestbook_id");
  CREATE INDEX "payload_locked_documents_rels_fanarts_id_idx" ON "payload_locked_documents_rels" USING btree ("fanarts_id");
  CREATE INDEX "payload_locked_documents_rels_polls_id_idx" ON "payload_locked_documents_rels" USING btree ("polls_id");
  CREATE INDEX "payload_locked_documents_rels_poll_votes_id_idx" ON "payload_locked_documents_rels" USING btree ("poll_votes_id");
  CREATE INDEX "payload_locked_documents_rels_announcements_id_idx" ON "payload_locked_documents_rels" USING btree ("announcements_id");
  CREATE INDEX "payload_locked_documents_rels_downloads_id_idx" ON "payload_locked_documents_rels" USING btree ("downloads_id");
  CREATE INDEX "payload_locked_documents_rels_protected_files_id_idx" ON "payload_locked_documents_rels" USING btree ("protected_files_id");
  CREATE INDEX "payload_locked_documents_rels_surprise_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("surprise_codes_id");
  CREATE INDEX "payload_locked_documents_rels_notify_signups_id_idx" ON "payload_locked_documents_rels" USING btree ("notify_signups_id");
  CREATE INDEX "payload_locked_documents_rels_members_id_idx" ON "payload_locked_documents_rels" USING btree ("members_id");
  CREATE INDEX "payload_locked_documents_rels_scores_id_idx" ON "payload_locked_documents_rels" USING btree ("scores_id");
  CREATE INDEX "payload_locked_documents_rels_game_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("game_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_legal_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("legal_pages_id");
  CREATE INDEX "payload_locked_documents_rels_activity_log_id_idx" ON "payload_locked_documents_rels" USING btree ("activity_log_id");
  CREATE INDEX "payload_locked_documents_rels_webhook_events_id_idx" ON "payload_locked_documents_rels" USING btree ("webhook_events_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_og_image_idx" ON "site_settings" USING btree ("og_image_id");
  CREATE INDEX "site_settings_avatar_idx" ON "site_settings" USING btree ("avatar_id");
  CREATE INDEX "home_page_blocks_hero_order_idx" ON "home_page_blocks_hero" USING btree ("_order");
  CREATE INDEX "home_page_blocks_hero_parent_id_idx" ON "home_page_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_hero_path_idx" ON "home_page_blocks_hero" USING btree ("_path");
  CREATE INDEX "home_page_blocks_live_status_order_idx" ON "home_page_blocks_live_status" USING btree ("_order");
  CREATE INDEX "home_page_blocks_live_status_parent_id_idx" ON "home_page_blocks_live_status" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_live_status_path_idx" ON "home_page_blocks_live_status" USING btree ("_path");
  CREATE INDEX "home_page_blocks_schedule_manual_order_idx" ON "home_page_blocks_schedule_manual" USING btree ("_order");
  CREATE INDEX "home_page_blocks_schedule_manual_parent_id_idx" ON "home_page_blocks_schedule_manual" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_schedule_order_idx" ON "home_page_blocks_schedule" USING btree ("_order");
  CREATE INDEX "home_page_blocks_schedule_parent_id_idx" ON "home_page_blocks_schedule" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_schedule_path_idx" ON "home_page_blocks_schedule" USING btree ("_path");
  CREATE INDEX "home_page_blocks_clips_order_idx" ON "home_page_blocks_clips" USING btree ("_order");
  CREATE INDEX "home_page_blocks_clips_parent_id_idx" ON "home_page_blocks_clips" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_clips_path_idx" ON "home_page_blocks_clips" USING btree ("_path");
  CREATE INDEX "home_page_blocks_youtube_order_idx" ON "home_page_blocks_youtube" USING btree ("_order");
  CREATE INDEX "home_page_blocks_youtube_parent_id_idx" ON "home_page_blocks_youtube" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_youtube_path_idx" ON "home_page_blocks_youtube" USING btree ("_path");
  CREATE INDEX "home_page_blocks_social_posts_posts_order_idx" ON "home_page_blocks_social_posts_posts" USING btree ("_order");
  CREATE INDEX "home_page_blocks_social_posts_posts_parent_id_idx" ON "home_page_blocks_social_posts_posts" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_social_posts_posts_thumbnail_idx" ON "home_page_blocks_social_posts_posts" USING btree ("thumbnail_id");
  CREATE INDEX "home_page_blocks_social_posts_order_idx" ON "home_page_blocks_social_posts" USING btree ("_order");
  CREATE INDEX "home_page_blocks_social_posts_parent_id_idx" ON "home_page_blocks_social_posts" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_social_posts_path_idx" ON "home_page_blocks_social_posts" USING btree ("_path");
  CREATE INDEX "home_page_blocks_social_grid_order_idx" ON "home_page_blocks_social_grid" USING btree ("_order");
  CREATE INDEX "home_page_blocks_social_grid_parent_id_idx" ON "home_page_blocks_social_grid" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_social_grid_path_idx" ON "home_page_blocks_social_grid" USING btree ("_path");
  CREATE INDEX "home_page_blocks_community_goal_order_idx" ON "home_page_blocks_community_goal" USING btree ("_order");
  CREATE INDEX "home_page_blocks_community_goal_parent_id_idx" ON "home_page_blocks_community_goal" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_community_goal_path_idx" ON "home_page_blocks_community_goal" USING btree ("_path");
  CREATE INDEX "home_page_blocks_rich_text_order_idx" ON "home_page_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "home_page_blocks_rich_text_parent_id_idx" ON "home_page_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_rich_text_path_idx" ON "home_page_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "home_page_blocks_image_order_idx" ON "home_page_blocks_image" USING btree ("_order");
  CREATE INDEX "home_page_blocks_image_parent_id_idx" ON "home_page_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_image_path_idx" ON "home_page_blocks_image" USING btree ("_path");
  CREATE INDEX "home_page_blocks_image_image_idx" ON "home_page_blocks_image" USING btree ("image_id");
  CREATE INDEX "home_page_seo_seo_image_idx" ON "home_page" USING btree ("seo_image_id");
  CREATE INDEX "_home_page_v_blocks_hero_order_idx" ON "_home_page_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_hero_parent_id_idx" ON "_home_page_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_hero_path_idx" ON "_home_page_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_home_page_v_blocks_live_status_order_idx" ON "_home_page_v_blocks_live_status" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_live_status_parent_id_idx" ON "_home_page_v_blocks_live_status" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_live_status_path_idx" ON "_home_page_v_blocks_live_status" USING btree ("_path");
  CREATE INDEX "_home_page_v_blocks_schedule_manual_order_idx" ON "_home_page_v_blocks_schedule_manual" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_schedule_manual_parent_id_idx" ON "_home_page_v_blocks_schedule_manual" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_schedule_order_idx" ON "_home_page_v_blocks_schedule" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_schedule_parent_id_idx" ON "_home_page_v_blocks_schedule" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_schedule_path_idx" ON "_home_page_v_blocks_schedule" USING btree ("_path");
  CREATE INDEX "_home_page_v_blocks_clips_order_idx" ON "_home_page_v_blocks_clips" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_clips_parent_id_idx" ON "_home_page_v_blocks_clips" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_clips_path_idx" ON "_home_page_v_blocks_clips" USING btree ("_path");
  CREATE INDEX "_home_page_v_blocks_youtube_order_idx" ON "_home_page_v_blocks_youtube" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_youtube_parent_id_idx" ON "_home_page_v_blocks_youtube" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_youtube_path_idx" ON "_home_page_v_blocks_youtube" USING btree ("_path");
  CREATE INDEX "_home_page_v_blocks_social_posts_posts_order_idx" ON "_home_page_v_blocks_social_posts_posts" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_social_posts_posts_parent_id_idx" ON "_home_page_v_blocks_social_posts_posts" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_social_posts_posts_thumbnail_idx" ON "_home_page_v_blocks_social_posts_posts" USING btree ("thumbnail_id");
  CREATE INDEX "_home_page_v_blocks_social_posts_order_idx" ON "_home_page_v_blocks_social_posts" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_social_posts_parent_id_idx" ON "_home_page_v_blocks_social_posts" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_social_posts_path_idx" ON "_home_page_v_blocks_social_posts" USING btree ("_path");
  CREATE INDEX "_home_page_v_blocks_social_grid_order_idx" ON "_home_page_v_blocks_social_grid" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_social_grid_parent_id_idx" ON "_home_page_v_blocks_social_grid" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_social_grid_path_idx" ON "_home_page_v_blocks_social_grid" USING btree ("_path");
  CREATE INDEX "_home_page_v_blocks_community_goal_order_idx" ON "_home_page_v_blocks_community_goal" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_community_goal_parent_id_idx" ON "_home_page_v_blocks_community_goal" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_community_goal_path_idx" ON "_home_page_v_blocks_community_goal" USING btree ("_path");
  CREATE INDEX "_home_page_v_blocks_rich_text_order_idx" ON "_home_page_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_rich_text_parent_id_idx" ON "_home_page_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_rich_text_path_idx" ON "_home_page_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_home_page_v_blocks_image_order_idx" ON "_home_page_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_image_parent_id_idx" ON "_home_page_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_image_path_idx" ON "_home_page_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_home_page_v_blocks_image_image_idx" ON "_home_page_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_home_page_v_version_seo_version_seo_image_idx" ON "_home_page_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_home_page_v_created_at_idx" ON "_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "_home_page_v" USING btree ("updated_at");
  CREATE INDEX "biography_page_blocks_rich_text_order_idx" ON "biography_page_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "biography_page_blocks_rich_text_parent_id_idx" ON "biography_page_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "biography_page_blocks_rich_text_path_idx" ON "biography_page_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "biography_page_blocks_image_order_idx" ON "biography_page_blocks_image" USING btree ("_order");
  CREATE INDEX "biography_page_blocks_image_parent_id_idx" ON "biography_page_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "biography_page_blocks_image_path_idx" ON "biography_page_blocks_image" USING btree ("_path");
  CREATE INDEX "biography_page_blocks_image_image_idx" ON "biography_page_blocks_image" USING btree ("image_id");
  CREATE INDEX "biography_page_blocks_gallery_images_order_idx" ON "biography_page_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "biography_page_blocks_gallery_images_parent_id_idx" ON "biography_page_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "biography_page_blocks_gallery_images_image_idx" ON "biography_page_blocks_gallery_images" USING btree ("image_id");
  CREATE INDEX "biography_page_blocks_gallery_order_idx" ON "biography_page_blocks_gallery" USING btree ("_order");
  CREATE INDEX "biography_page_blocks_gallery_parent_id_idx" ON "biography_page_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "biography_page_blocks_gallery_path_idx" ON "biography_page_blocks_gallery" USING btree ("_path");
  CREATE INDEX "biography_page_blocks_timeline_events_order_idx" ON "biography_page_blocks_timeline_events" USING btree ("_order");
  CREATE INDEX "biography_page_blocks_timeline_events_parent_id_idx" ON "biography_page_blocks_timeline_events" USING btree ("_parent_id");
  CREATE INDEX "biography_page_blocks_timeline_order_idx" ON "biography_page_blocks_timeline" USING btree ("_order");
  CREATE INDEX "biography_page_blocks_timeline_parent_id_idx" ON "biography_page_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "biography_page_blocks_timeline_path_idx" ON "biography_page_blocks_timeline" USING btree ("_path");
  CREATE INDEX "biography_page_blocks_profile_card_facts_order_idx" ON "biography_page_blocks_profile_card_facts" USING btree ("_order");
  CREATE INDEX "biography_page_blocks_profile_card_facts_parent_id_idx" ON "biography_page_blocks_profile_card_facts" USING btree ("_parent_id");
  CREATE INDEX "biography_page_blocks_profile_card_order_idx" ON "biography_page_blocks_profile_card" USING btree ("_order");
  CREATE INDEX "biography_page_blocks_profile_card_parent_id_idx" ON "biography_page_blocks_profile_card" USING btree ("_parent_id");
  CREATE INDEX "biography_page_blocks_profile_card_path_idx" ON "biography_page_blocks_profile_card" USING btree ("_path");
  CREATE INDEX "biography_page_blocks_profile_card_avatar_idx" ON "biography_page_blocks_profile_card" USING btree ("avatar_id");
  CREATE INDEX "biography_page_blocks_community_goal_order_idx" ON "biography_page_blocks_community_goal" USING btree ("_order");
  CREATE INDEX "biography_page_blocks_community_goal_parent_id_idx" ON "biography_page_blocks_community_goal" USING btree ("_parent_id");
  CREATE INDEX "biography_page_blocks_community_goal_path_idx" ON "biography_page_blocks_community_goal" USING btree ("_path");
  CREATE INDEX "biography_page_seo_seo_image_idx" ON "biography_page" USING btree ("seo_image_id");
  CREATE INDEX "_biography_page_v_blocks_rich_text_order_idx" ON "_biography_page_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_biography_page_v_blocks_rich_text_parent_id_idx" ON "_biography_page_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_biography_page_v_blocks_rich_text_path_idx" ON "_biography_page_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_biography_page_v_blocks_image_order_idx" ON "_biography_page_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_biography_page_v_blocks_image_parent_id_idx" ON "_biography_page_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_biography_page_v_blocks_image_path_idx" ON "_biography_page_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_biography_page_v_blocks_image_image_idx" ON "_biography_page_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_biography_page_v_blocks_gallery_images_order_idx" ON "_biography_page_v_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "_biography_page_v_blocks_gallery_images_parent_id_idx" ON "_biography_page_v_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_biography_page_v_blocks_gallery_images_image_idx" ON "_biography_page_v_blocks_gallery_images" USING btree ("image_id");
  CREATE INDEX "_biography_page_v_blocks_gallery_order_idx" ON "_biography_page_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_biography_page_v_blocks_gallery_parent_id_idx" ON "_biography_page_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_biography_page_v_blocks_gallery_path_idx" ON "_biography_page_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_biography_page_v_blocks_timeline_events_order_idx" ON "_biography_page_v_blocks_timeline_events" USING btree ("_order");
  CREATE INDEX "_biography_page_v_blocks_timeline_events_parent_id_idx" ON "_biography_page_v_blocks_timeline_events" USING btree ("_parent_id");
  CREATE INDEX "_biography_page_v_blocks_timeline_order_idx" ON "_biography_page_v_blocks_timeline" USING btree ("_order");
  CREATE INDEX "_biography_page_v_blocks_timeline_parent_id_idx" ON "_biography_page_v_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "_biography_page_v_blocks_timeline_path_idx" ON "_biography_page_v_blocks_timeline" USING btree ("_path");
  CREATE INDEX "_biography_page_v_blocks_profile_card_facts_order_idx" ON "_biography_page_v_blocks_profile_card_facts" USING btree ("_order");
  CREATE INDEX "_biography_page_v_blocks_profile_card_facts_parent_id_idx" ON "_biography_page_v_blocks_profile_card_facts" USING btree ("_parent_id");
  CREATE INDEX "_biography_page_v_blocks_profile_card_order_idx" ON "_biography_page_v_blocks_profile_card" USING btree ("_order");
  CREATE INDEX "_biography_page_v_blocks_profile_card_parent_id_idx" ON "_biography_page_v_blocks_profile_card" USING btree ("_parent_id");
  CREATE INDEX "_biography_page_v_blocks_profile_card_path_idx" ON "_biography_page_v_blocks_profile_card" USING btree ("_path");
  CREATE INDEX "_biography_page_v_blocks_profile_card_avatar_idx" ON "_biography_page_v_blocks_profile_card" USING btree ("avatar_id");
  CREATE INDEX "_biography_page_v_blocks_community_goal_order_idx" ON "_biography_page_v_blocks_community_goal" USING btree ("_order");
  CREATE INDEX "_biography_page_v_blocks_community_goal_parent_id_idx" ON "_biography_page_v_blocks_community_goal" USING btree ("_parent_id");
  CREATE INDEX "_biography_page_v_blocks_community_goal_path_idx" ON "_biography_page_v_blocks_community_goal" USING btree ("_path");
  CREATE INDEX "_biography_page_v_version_seo_version_seo_image_idx" ON "_biography_page_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_biography_page_v_created_at_idx" ON "_biography_page_v" USING btree ("created_at");
  CREATE INDEX "_biography_page_v_updated_at_idx" ON "_biography_page_v" USING btree ("updated_at");
  CREATE INDEX "links_page_links_order_idx" ON "links_page_links" USING btree ("_order");
  CREATE INDEX "links_page_links_parent_id_idx" ON "links_page_links" USING btree ("_parent_id");
  CREATE INDEX "links_page_seo_seo_image_idx" ON "links_page" USING btree ("seo_image_id");
  CREATE INDEX "_links_page_v_version_links_order_idx" ON "_links_page_v_version_links" USING btree ("_order");
  CREATE INDEX "_links_page_v_version_links_parent_id_idx" ON "_links_page_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "_links_page_v_version_seo_version_seo_image_idx" ON "_links_page_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_links_page_v_created_at_idx" ON "_links_page_v" USING btree ("created_at");
  CREATE INDEX "_links_page_v_updated_at_idx" ON "_links_page_v" USING btree ("updated_at");
  CREATE INDEX "shop_settings_vat_rates_order_idx" ON "shop_settings_vat_rates" USING btree ("_order");
  CREATE INDEX "shop_settings_vat_rates_parent_id_idx" ON "shop_settings_vat_rates" USING btree ("_parent_id");
  CREATE INDEX "shop_settings_enabled_payments_order_idx" ON "shop_settings_enabled_payments" USING btree ("order");
  CREATE INDEX "shop_settings_enabled_payments_parent_idx" ON "shop_settings_enabled_payments" USING btree ("parent_id");
  CREATE INDEX "easter_eggs_secret_reward_idx" ON "easter_eggs" USING btree ("secret_reward_id");
  CREATE INDEX "game_settings_saac_unlocks_order_idx" ON "game_settings_saac_unlocks" USING btree ("_order");
  CREATE INDEX "game_settings_saac_unlocks_parent_id_idx" ON "game_settings_saac_unlocks" USING btree ("_parent_id");
  CREATE INDEX "game_settings_saac_unlocks_reward_idx" ON "game_settings_saac_unlocks" USING btree ("reward_id");
  CREATE INDEX "_legal_identity_v_created_at_idx" ON "_legal_identity_v" USING btree ("created_at");
  CREATE INDEX "_legal_identity_v_updated_at_idx" ON "_legal_identity_v" USING btree ("updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "products_images" CASCADE;
  DROP TABLE "products_variants" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "_products_v_version_images" CASCADE;
  DROP TABLE "_products_v_version_variants" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "_products_v_rels" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders_refunds" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "coupons" CASCADE;
  DROP TABLE "coupons_rels" CASCADE;
  DROP TABLE "shipping_zones" CASCADE;
  DROP TABLE "guestbook" CASCADE;
  DROP TABLE "fanarts" CASCADE;
  DROP TABLE "polls_options" CASCADE;
  DROP TABLE "polls" CASCADE;
  DROP TABLE "poll_votes" CASCADE;
  DROP TABLE "announcements" CASCADE;
  DROP TABLE "downloads_files" CASCADE;
  DROP TABLE "downloads" CASCADE;
  DROP TABLE "protected_files" CASCADE;
  DROP TABLE "surprise_codes" CASCADE;
  DROP TABLE "surprise_codes_rels" CASCADE;
  DROP TABLE "notify_signups" CASCADE;
  DROP TABLE "members" CASCADE;
  DROP TABLE "members_rels" CASCADE;
  DROP TABLE "scores" CASCADE;
  DROP TABLE "game_sessions" CASCADE;
  DROP TABLE "legal_pages" CASCADE;
  DROP TABLE "_legal_pages_v" CASCADE;
  DROP TABLE "activity_log" CASCADE;
  DROP TABLE "webhook_events" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "theme" CASCADE;
  DROP TABLE "home_page_blocks_hero" CASCADE;
  DROP TABLE "home_page_blocks_live_status" CASCADE;
  DROP TABLE "home_page_blocks_schedule_manual" CASCADE;
  DROP TABLE "home_page_blocks_schedule" CASCADE;
  DROP TABLE "home_page_blocks_clips" CASCADE;
  DROP TABLE "home_page_blocks_youtube" CASCADE;
  DROP TABLE "home_page_blocks_social_posts_posts" CASCADE;
  DROP TABLE "home_page_blocks_social_posts" CASCADE;
  DROP TABLE "home_page_blocks_social_grid" CASCADE;
  DROP TABLE "home_page_blocks_community_goal" CASCADE;
  DROP TABLE "home_page_blocks_rich_text" CASCADE;
  DROP TABLE "home_page_blocks_image" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "_home_page_v_blocks_hero" CASCADE;
  DROP TABLE "_home_page_v_blocks_live_status" CASCADE;
  DROP TABLE "_home_page_v_blocks_schedule_manual" CASCADE;
  DROP TABLE "_home_page_v_blocks_schedule" CASCADE;
  DROP TABLE "_home_page_v_blocks_clips" CASCADE;
  DROP TABLE "_home_page_v_blocks_youtube" CASCADE;
  DROP TABLE "_home_page_v_blocks_social_posts_posts" CASCADE;
  DROP TABLE "_home_page_v_blocks_social_posts" CASCADE;
  DROP TABLE "_home_page_v_blocks_social_grid" CASCADE;
  DROP TABLE "_home_page_v_blocks_community_goal" CASCADE;
  DROP TABLE "_home_page_v_blocks_rich_text" CASCADE;
  DROP TABLE "_home_page_v_blocks_image" CASCADE;
  DROP TABLE "_home_page_v" CASCADE;
  DROP TABLE "biography_page_blocks_rich_text" CASCADE;
  DROP TABLE "biography_page_blocks_image" CASCADE;
  DROP TABLE "biography_page_blocks_gallery_images" CASCADE;
  DROP TABLE "biography_page_blocks_gallery" CASCADE;
  DROP TABLE "biography_page_blocks_timeline_events" CASCADE;
  DROP TABLE "biography_page_blocks_timeline" CASCADE;
  DROP TABLE "biography_page_blocks_profile_card_facts" CASCADE;
  DROP TABLE "biography_page_blocks_profile_card" CASCADE;
  DROP TABLE "biography_page_blocks_community_goal" CASCADE;
  DROP TABLE "biography_page" CASCADE;
  DROP TABLE "_biography_page_v_blocks_rich_text" CASCADE;
  DROP TABLE "_biography_page_v_blocks_image" CASCADE;
  DROP TABLE "_biography_page_v_blocks_gallery_images" CASCADE;
  DROP TABLE "_biography_page_v_blocks_gallery" CASCADE;
  DROP TABLE "_biography_page_v_blocks_timeline_events" CASCADE;
  DROP TABLE "_biography_page_v_blocks_timeline" CASCADE;
  DROP TABLE "_biography_page_v_blocks_profile_card_facts" CASCADE;
  DROP TABLE "_biography_page_v_blocks_profile_card" CASCADE;
  DROP TABLE "_biography_page_v_blocks_community_goal" CASCADE;
  DROP TABLE "_biography_page_v" CASCADE;
  DROP TABLE "links_page_links" CASCADE;
  DROP TABLE "links_page" CASCADE;
  DROP TABLE "_links_page_v_version_links" CASCADE;
  DROP TABLE "_links_page_v" CASCADE;
  DROP TABLE "shop_settings_vat_rates" CASCADE;
  DROP TABLE "shop_settings_enabled_payments" CASCADE;
  DROP TABLE "shop_settings" CASCADE;
  DROP TABLE "easter_eggs" CASCADE;
  DROP TABLE "game_settings_saac_unlocks" CASCADE;
  DROP TABLE "game_settings" CASCADE;
  DROP TABLE "legal_identity" CASCADE;
  DROP TABLE "_legal_identity_v" CASCADE;
  DROP TABLE "integrations" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_products_fulfillment";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum__products_v_version_fulfillment";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_provider";
  DROP TYPE "public"."enum_coupons_type";
  DROP TYPE "public"."enum_guestbook_status";
  DROP TYPE "public"."enum_guestbook_mood";
  DROP TYPE "public"."enum_fanarts_status";
  DROP TYPE "public"."enum_downloads_files_format";
  DROP TYPE "public"."enum_downloads_kind";
  DROP TYPE "public"."enum_surprise_codes_source";
  DROP TYPE "public"."enum_legal_pages_slug";
  DROP TYPE "public"."enum_legal_pages_status";
  DROP TYPE "public"."enum__legal_pages_v_version_slug";
  DROP TYPE "public"."enum__legal_pages_v_version_status";
  DROP TYPE "public"."enum_site_settings_home_status";
  DROP TYPE "public"."enum_site_settings_biography_status";
  DROP TYPE "public"."enum_site_settings_community_status";
  DROP TYPE "public"."enum_site_settings_shop_status";
  DROP TYPE "public"."enum_site_settings_arcade_status";
  DROP TYPE "public"."enum_site_settings_links_status";
  DROP TYPE "public"."enum_theme_effects_default_mode";
  DROP TYPE "public"."enum_home_page_blocks_schedule_manual_day";
  DROP TYPE "public"."enum_home_page_blocks_schedule_manual_kind";
  DROP TYPE "public"."enum_home_page_blocks_schedule_source";
  DROP TYPE "public"."enum_home_page_blocks_social_posts_posts_network";
  DROP TYPE "public"."enum_home_page_blocks_image_style";
  DROP TYPE "public"."enum__home_page_v_blocks_schedule_manual_day";
  DROP TYPE "public"."enum__home_page_v_blocks_schedule_manual_kind";
  DROP TYPE "public"."enum__home_page_v_blocks_schedule_source";
  DROP TYPE "public"."enum__home_page_v_blocks_social_posts_posts_network";
  DROP TYPE "public"."enum__home_page_v_blocks_image_style";
  DROP TYPE "public"."enum_biography_page_blocks_image_style";
  DROP TYPE "public"."enum_biography_page_blocks_timeline_events_icon";
  DROP TYPE "public"."enum_biography_page_blocks_profile_card_presence";
  DROP TYPE "public"."enum__biography_page_v_blocks_image_style";
  DROP TYPE "public"."enum__biography_page_v_blocks_timeline_events_icon";
  DROP TYPE "public"."enum__biography_page_v_blocks_profile_card_presence";
  DROP TYPE "public"."enum_links_page_links_icon";
  DROP TYPE "public"."enum_links_page_links_color";
  DROP TYPE "public"."enum__links_page_v_version_links_icon";
  DROP TYPE "public"."enum__links_page_v_version_links_color";
  DROP TYPE "public"."enum_shop_settings_enabled_payments";
  DROP TYPE "public"."enum_shop_settings_currency";
  DROP TYPE "public"."enum_easter_eggs_secret_hint";
  DROP TYPE "public"."enum_game_settings_saac_unlocks_condition";
  DROP TYPE "public"."enum_game_settings_saac_difficulty";
  DROP TYPE "public"."enum_integrations_analytics_provider";`)
}
