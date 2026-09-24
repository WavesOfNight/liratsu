import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "home_page_blocks_schedule_manual" CASCADE;
  DROP TABLE "_home_page_v_blocks_schedule_manual" CASCADE;
  DROP TYPE "public"."enum_home_page_blocks_schedule_manual_day";
  DROP TYPE "public"."enum_home_page_blocks_schedule_manual_kind";
  DROP TYPE "public"."enum__home_page_v_blocks_schedule_manual_day";
  DROP TYPE "public"."enum__home_page_v_blocks_schedule_manual_kind";
  CREATE TYPE "public"."enum_schedule_items_kind" AS ENUM('game', 'art', 'music', 'chat');
  CREATE TABLE "schedule" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE "schedule_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"time" varchar NOT NULL,
  	"kind" "enum_schedule_items_kind" DEFAULT 'game',
  	"title" varchar NOT NULL,
  	"game" varchar,
  	"box_art_url" varchar
  );

  ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."schedule"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "schedule_items_order_idx" ON "schedule_items" USING btree ("_order");
  CREATE INDEX "schedule_items_parent_id_idx" ON "schedule_items" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "schedule_items" CASCADE;
  DROP TABLE "schedule" CASCADE;
  DROP TYPE "public"."enum_schedule_items_kind";
  CREATE TYPE "public"."enum_home_page_blocks_schedule_manual_day" AS ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche');
  CREATE TYPE "public"."enum_home_page_blocks_schedule_manual_kind" AS ENUM('game', 'art', 'music', 'chat');
  CREATE TYPE "public"."enum__home_page_v_blocks_schedule_manual_day" AS ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche');
  CREATE TYPE "public"."enum__home_page_v_blocks_schedule_manual_kind" AS ENUM('game', 'art', 'music', 'chat');
  CREATE TABLE "home_page_blocks_schedule_manual" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "enum_home_page_blocks_schedule_manual_day" NOT NULL,
  	"time" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum_home_page_blocks_schedule_manual_kind" DEFAULT 'game',
  	"game" varchar,
  	"box_art_url" varchar
  );

  CREATE TABLE "_home_page_v_blocks_schedule_manual" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"day" "enum__home_page_v_blocks_schedule_manual_day" NOT NULL,
  	"time" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum__home_page_v_blocks_schedule_manual_kind" DEFAULT 'game',
  	"game" varchar,
  	"box_art_url" varchar,
  	"_uuid" varchar
  );

  ALTER TABLE "home_page_blocks_schedule_manual" ADD CONSTRAINT "home_page_blocks_schedule_manual_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_blocks_schedule"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_blocks_schedule_manual" ADD CONSTRAINT "_home_page_v_blocks_schedule_manual_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_blocks_schedule"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_blocks_schedule_manual_order_idx" ON "home_page_blocks_schedule_manual" USING btree ("_order");
  CREATE INDEX "home_page_blocks_schedule_manual_parent_id_idx" ON "home_page_blocks_schedule_manual" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_blocks_schedule_manual_order_idx" ON "_home_page_v_blocks_schedule_manual" USING btree ("_order");
  CREATE INDEX "_home_page_v_blocks_schedule_manual_parent_id_idx" ON "_home_page_v_blocks_schedule_manual" USING btree ("_parent_id");`)
}
