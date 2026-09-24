import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guestbook_flags" AS ENUM('insult', 'vulgar', 'link', 'personal', 'spam', 'caps', 'custom', 'duplicate');
  CREATE TYPE "public"."enum_fanarts_flags" AS ENUM('insult', 'vulgar', 'link', 'personal', 'spam', 'caps', 'custom', 'duplicate');
  CREATE TYPE "public"."enum_moderation_settings_links" AS ENUM('block', 'review', 'allow');
  CREATE TABLE "guestbook_flags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_guestbook_flags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "fanarts_flags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_fanarts_flags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "moderation_settings_rejection_reasons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "moderation_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"links" "enum_moderation_settings_links" DEFAULT 'block',
  	"allowed_domains" varchar DEFAULT 'liratsu.fr
  twitch.tv
  youtube.com
  youtu.be
  instagram.com
  tiktok.com',
  	"block_personal" boolean DEFAULT true,
  	"blocked_words" varchar,
  	"watched_words" varchar,
  	"auto_approve_clean" boolean DEFAULT false,
  	"reject_duplicates" boolean DEFAULT true,
  	"email_artist" boolean DEFAULT true,
  	"notify" boolean DEFAULT true,
  	"notify_emails" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "guestbook" ADD COLUMN "rejection_reason" varchar;
  ALTER TABLE "guestbook" ADD COLUMN "flagged_terms" varchar;
  ALTER TABLE "guestbook" ADD COLUMN "moderated_by_id" integer;
  ALTER TABLE "guestbook" ADD COLUMN "moderated_at" timestamp(3) with time zone;
  ALTER TABLE "fanarts" ADD COLUMN "rejection_reason" varchar;
  ALTER TABLE "fanarts" ADD COLUMN "flagged_terms" varchar;
  ALTER TABLE "fanarts" ADD COLUMN "moderated_by_id" integer;
  ALTER TABLE "fanarts" ADD COLUMN "moderated_at" timestamp(3) with time zone;
  ALTER TABLE "fanarts" ADD COLUMN "file_hash" varchar;
  ALTER TABLE "fanarts" ADD COLUMN "sizes_preview_url" varchar;
  ALTER TABLE "fanarts" ADD COLUMN "sizes_preview_width" numeric;
  ALTER TABLE "fanarts" ADD COLUMN "sizes_preview_height" numeric;
  ALTER TABLE "fanarts" ADD COLUMN "sizes_preview_mime_type" varchar;
  ALTER TABLE "fanarts" ADD COLUMN "sizes_preview_filesize" numeric;
  ALTER TABLE "fanarts" ADD COLUMN "sizes_preview_filename" varchar;
  ALTER TABLE "guestbook_flags" ADD CONSTRAINT "guestbook_flags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guestbook"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "fanarts_flags" ADD CONSTRAINT "fanarts_flags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."fanarts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "moderation_settings_rejection_reasons" ADD CONSTRAINT "moderation_settings_rejection_reasons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."moderation_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guestbook_flags_order_idx" ON "guestbook_flags" USING btree ("order");
  CREATE INDEX "guestbook_flags_parent_idx" ON "guestbook_flags" USING btree ("parent_id");
  CREATE INDEX "fanarts_flags_order_idx" ON "fanarts_flags" USING btree ("order");
  CREATE INDEX "fanarts_flags_parent_idx" ON "fanarts_flags" USING btree ("parent_id");
  CREATE INDEX "moderation_settings_rejection_reasons_order_idx" ON "moderation_settings_rejection_reasons" USING btree ("_order");
  CREATE INDEX "moderation_settings_rejection_reasons_parent_id_idx" ON "moderation_settings_rejection_reasons" USING btree ("_parent_id");
  ALTER TABLE "guestbook" ADD CONSTRAINT "guestbook_moderated_by_id_users_id_fk" FOREIGN KEY ("moderated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "fanarts" ADD CONSTRAINT "fanarts_moderated_by_id_users_id_fk" FOREIGN KEY ("moderated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "guestbook_moderated_by_idx" ON "guestbook" USING btree ("moderated_by_id");
  CREATE INDEX "fanarts_moderated_by_idx" ON "fanarts" USING btree ("moderated_by_id");
  CREATE INDEX "fanarts_file_hash_idx" ON "fanarts" USING btree ("file_hash");
  CREATE INDEX "fanarts_sizes_preview_sizes_preview_filename_idx" ON "fanarts" USING btree ("sizes_preview_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guestbook_flags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fanarts_flags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "moderation_settings_rejection_reasons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "moderation_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guestbook_flags" CASCADE;
  DROP TABLE "fanarts_flags" CASCADE;
  DROP TABLE "moderation_settings_rejection_reasons" CASCADE;
  DROP TABLE "moderation_settings" CASCADE;
  ALTER TABLE "guestbook" DROP CONSTRAINT "guestbook_moderated_by_id_users_id_fk";
  
  ALTER TABLE "fanarts" DROP CONSTRAINT "fanarts_moderated_by_id_users_id_fk";
  
  DROP INDEX "guestbook_moderated_by_idx";
  DROP INDEX "fanarts_moderated_by_idx";
  DROP INDEX "fanarts_file_hash_idx";
  DROP INDEX "fanarts_sizes_preview_sizes_preview_filename_idx";
  ALTER TABLE "guestbook" DROP COLUMN "rejection_reason";
  ALTER TABLE "guestbook" DROP COLUMN "flagged_terms";
  ALTER TABLE "guestbook" DROP COLUMN "moderated_by_id";
  ALTER TABLE "guestbook" DROP COLUMN "moderated_at";
  ALTER TABLE "fanarts" DROP COLUMN "rejection_reason";
  ALTER TABLE "fanarts" DROP COLUMN "flagged_terms";
  ALTER TABLE "fanarts" DROP COLUMN "moderated_by_id";
  ALTER TABLE "fanarts" DROP COLUMN "moderated_at";
  ALTER TABLE "fanarts" DROP COLUMN "file_hash";
  ALTER TABLE "fanarts" DROP COLUMN "sizes_preview_url";
  ALTER TABLE "fanarts" DROP COLUMN "sizes_preview_width";
  ALTER TABLE "fanarts" DROP COLUMN "sizes_preview_height";
  ALTER TABLE "fanarts" DROP COLUMN "sizes_preview_mime_type";
  ALTER TABLE "fanarts" DROP COLUMN "sizes_preview_filesize";
  ALTER TABLE "fanarts" DROP COLUMN "sizes_preview_filename";
  DROP TYPE "public"."enum_guestbook_flags";
  DROP TYPE "public"."enum_fanarts_flags";
  DROP TYPE "public"."enum_moderation_settings_links";`)
}
