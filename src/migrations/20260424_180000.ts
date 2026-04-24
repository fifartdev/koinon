import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Convert announcements.content from jsonb to varchar (textarea)
  await db.execute(sql`
    ALTER TABLE "announcements"
      ALTER COLUMN "content" TYPE varchar USING null,
      ALTER COLUMN "content" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "announcements"
      ALTER COLUMN "content" TYPE jsonb USING null,
      ALTER COLUMN "content" SET NOT NULL;
  `)
}
