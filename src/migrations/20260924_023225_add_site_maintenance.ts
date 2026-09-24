import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "maintenance_mode" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "maintenance_message" varchar DEFAULT 'Lionel travaille actuellement sur le site ✦ Repasse un peu plus tard !';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "maintenance_mode";
  ALTER TABLE "site_settings" DROP COLUMN "maintenance_message";`)
}
