import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "scores" ADD COLUMN "member_id" integer;
  ALTER TABLE "scores" ADD CONSTRAINT "scores_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "scores_member_idx" ON "scores" USING btree ("member_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "scores" DROP CONSTRAINT "scores_member_id_members_id_fk";
  DROP INDEX "scores_member_idx";
  ALTER TABLE "scores" DROP COLUMN "member_id";`)
}
