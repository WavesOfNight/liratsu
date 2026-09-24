import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "game_settings_ratsu_sprite_overrides" DROP CONSTRAINT "game_settings_ratsu_sprite_overrides_image_id_game_assets_id_fk";
  ALTER TABLE "game_settings_ratsu_sprite_overrides" DROP CONSTRAINT "game_settings_ratsu_sprite_overrides_parent_id_fk";
  DROP TABLE "game_settings_ratsu_sprite_overrides";
  DROP TYPE "public"."enum_game_settings_ratsu_sprite_overrides_key";

  ALTER TABLE "game_settings" ADD COLUMN "ratsu_start_bombs" numeric DEFAULT 1;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "game_settings" DROP COLUMN "ratsu_start_bombs";

  CREATE TYPE "public"."enum_game_settings_ratsu_sprite_overrides_key" AS ENUM('player', 'floorTile', 'wallTile', 'rockTile', 'pickupCoin', 'pickupHeart', 'enemyGoldfish', 'enemyBubble', 'enemyPopup', 'enemyCursor', 'enemyLag', 'enemyTroll', 'bossPopup', 'bossSun');
  CREATE TABLE "game_settings_ratsu_sprite_overrides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" "enum_game_settings_ratsu_sprite_overrides_key" NOT NULL,
  	"image_id" integer NOT NULL
  );
  ALTER TABLE "game_settings_ratsu_sprite_overrides" ADD CONSTRAINT "game_settings_ratsu_sprite_overrides_image_id_game_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."game_assets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "game_settings_ratsu_sprite_overrides" ADD CONSTRAINT "game_settings_ratsu_sprite_overrides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."game_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "game_settings_ratsu_sprite_overrides_order_idx" ON "game_settings_ratsu_sprite_overrides" USING btree ("_order");
  CREATE INDEX "game_settings_ratsu_sprite_overrides_parent_id_idx" ON "game_settings_ratsu_sprite_overrides" USING btree ("_parent_id");
  CREATE INDEX "game_settings_ratsu_sprite_overrides_image_idx" ON "game_settings_ratsu_sprite_overrides" USING btree ("image_id");`)
}
