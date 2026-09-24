import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "integrations" ADD COLUMN "twitch_broadcaster_refresh_token" varchar;

  CREATE TYPE "public"."enum_home_page_blocks_community_goal_source" AS ENUM('manual', 'twitch-followers', 'twitch-subs');
  ALTER TABLE "home_page_blocks_community_goal" ALTER COLUMN "current" DROP NOT NULL;
  ALTER TABLE "home_page_blocks_community_goal" ADD COLUMN "source" "public"."enum_home_page_blocks_community_goal_source" DEFAULT 'manual';

  CREATE TYPE "public"."enum__home_page_v_blocks_community_goal_source" AS ENUM('manual', 'twitch-followers', 'twitch-subs');
  ALTER TABLE "_home_page_v_blocks_community_goal" ALTER COLUMN "current" DROP NOT NULL;
  ALTER TABLE "_home_page_v_blocks_community_goal" ADD COLUMN "source" "public"."enum__home_page_v_blocks_community_goal_source" DEFAULT 'manual';

  CREATE TYPE "public"."enum_biography_page_blocks_community_goal_source" AS ENUM('manual', 'twitch-followers', 'twitch-subs');
  ALTER TABLE "biography_page_blocks_community_goal" ALTER COLUMN "current" DROP NOT NULL;
  ALTER TABLE "biography_page_blocks_community_goal" ADD COLUMN "source" "public"."enum_biography_page_blocks_community_goal_source" DEFAULT 'manual';

  CREATE TYPE "public"."enum__biography_page_v_blocks_community_goal_source" AS ENUM('manual', 'twitch-followers', 'twitch-subs');
  ALTER TABLE "_biography_page_v_blocks_community_goal" ALTER COLUMN "current" DROP NOT NULL;
  ALTER TABLE "_biography_page_v_blocks_community_goal" ADD COLUMN "source" "public"."enum__biography_page_v_blocks_community_goal_source" DEFAULT 'manual';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "_biography_page_v_blocks_community_goal" DROP COLUMN "source";
  DROP TYPE "public"."enum__biography_page_v_blocks_community_goal_source";
  ALTER TABLE "_biography_page_v_blocks_community_goal" ALTER COLUMN "current" SET NOT NULL;

  ALTER TABLE "biography_page_blocks_community_goal" DROP COLUMN "source";
  DROP TYPE "public"."enum_biography_page_blocks_community_goal_source";
  ALTER TABLE "biography_page_blocks_community_goal" ALTER COLUMN "current" SET NOT NULL;

  ALTER TABLE "_home_page_v_blocks_community_goal" DROP COLUMN "source";
  DROP TYPE "public"."enum__home_page_v_blocks_community_goal_source";
  ALTER TABLE "_home_page_v_blocks_community_goal" ALTER COLUMN "current" SET NOT NULL;

  ALTER TABLE "home_page_blocks_community_goal" DROP COLUMN "source";
  DROP TYPE "public"."enum_home_page_blocks_community_goal_source";
  ALTER TABLE "home_page_blocks_community_goal" ALTER COLUMN "current" SET NOT NULL;

  ALTER TABLE "integrations" DROP COLUMN "twitch_broadcaster_refresh_token";`)
}
