import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "integrations" ADD COLUMN "discord_client_id" varchar;
  ALTER TABLE "integrations" ADD COLUMN "discord_client_secret" varchar;

  ALTER TABLE "members" ADD COLUMN "email" varchar;
  ALTER TABLE "members" ADD COLUMN "saved_address_first_name" varchar;
  ALTER TABLE "members" ADD COLUMN "saved_address_last_name" varchar;
  ALTER TABLE "members" ADD COLUMN "saved_address_line1" varchar;
  ALTER TABLE "members" ADD COLUMN "saved_address_line2" varchar;
  ALTER TABLE "members" ADD COLUMN "saved_address_postal_code" varchar;
  ALTER TABLE "members" ADD COLUMN "saved_address_city" varchar;
  ALTER TABLE "members" ADD COLUMN "saved_address_country" varchar;
  ALTER TABLE "members" ADD COLUMN "saved_address_phone" varchar;
  ALTER TABLE "members" ADD COLUMN "discord_id" varchar;
  ALTER TABLE "members" ADD COLUMN "discord_username" varchar;
  ALTER TABLE "members" ADD COLUMN "discord_avatar_url" varchar;
  CREATE UNIQUE INDEX "members_discord_id_idx" ON "members" USING btree ("discord_id");

  ALTER TABLE "orders" ADD COLUMN "member_id" integer;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_member_idx" ON "orders" USING btree ("member_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "orders" DROP CONSTRAINT "orders_member_id_members_id_fk";
  DROP INDEX "orders_member_idx";
  ALTER TABLE "orders" DROP COLUMN "member_id";

  DROP INDEX "members_discord_id_idx";
  ALTER TABLE "members" DROP COLUMN "discord_avatar_url";
  ALTER TABLE "members" DROP COLUMN "discord_username";
  ALTER TABLE "members" DROP COLUMN "discord_id";
  ALTER TABLE "members" DROP COLUMN "saved_address_phone";
  ALTER TABLE "members" DROP COLUMN "saved_address_country";
  ALTER TABLE "members" DROP COLUMN "saved_address_city";
  ALTER TABLE "members" DROP COLUMN "saved_address_postal_code";
  ALTER TABLE "members" DROP COLUMN "saved_address_line2";
  ALTER TABLE "members" DROP COLUMN "saved_address_line1";
  ALTER TABLE "members" DROP COLUMN "saved_address_last_name";
  ALTER TABLE "members" DROP COLUMN "saved_address_first_name";
  ALTER TABLE "members" DROP COLUMN "email";

  ALTER TABLE "integrations" DROP COLUMN "discord_client_secret";
  ALTER TABLE "integrations" DROP COLUMN "discord_client_id";`)
}
