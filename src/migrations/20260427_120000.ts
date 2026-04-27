import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Create dependents table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "dependents" (
      "id" serial PRIMARY KEY NOT NULL,
      "first_name" varchar NOT NULL,
      "last_name" varchar NOT NULL,
      "date_of_birth" timestamp(3) with time zone,
      "parent_id" integer,
      "tenant_id" integer,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "dependents"
      ADD CONSTRAINT "dependents_parent_id_users_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action,
      ADD CONSTRAINT "dependents_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "dependents_parent_idx" ON "dependents" USING btree ("parent_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "dependents_tenant_idx" ON "dependents" USING btree ("tenant_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "dependents_updated_at_idx" ON "dependents" USING btree ("updated_at");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "dependents_created_at_idx" ON "dependents" USING btree ("created_at");
  `)

  // 2. Add dependent_id to enrollments
  await db.execute(sql`
    ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "dependent_id" integer;
  `)

  await db.execute(sql`
    ALTER TABLE "enrollments"
      ADD CONSTRAINT "enrollments_dependent_id_dependents_id_fk"
        FOREIGN KEY ("dependent_id") REFERENCES "public"."dependents"("id") ON DELETE set null ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "enrollments_dependent_idx" ON "enrollments" USING btree ("dependent_id");
  `)

  // 3. Make member_id nullable (was NOT NULL)
  await db.execute(sql`
    ALTER TABLE "enrollments" ALTER COLUMN "member_id" DROP NOT NULL;
  `)

  // 4. Register dependents in payload_locked_documents_rels
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "dependents_id" integer;
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_dependents_fk"
        FOREIGN KEY ("dependents_id") REFERENCES "public"."dependents"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_dependents_id_idx"
      ON "payload_locked_documents_rels" USING btree ("dependents_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_dependents_fk";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_dependents_id_idx";
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "dependents_id";
  `)

  await db.execute(sql`
    ALTER TABLE "enrollments" ALTER COLUMN "member_id" SET NOT NULL;
  `)
  await db.execute(sql`
    ALTER TABLE "enrollments"
      DROP CONSTRAINT IF EXISTS "enrollments_dependent_id_dependents_id_fk";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "enrollments_dependent_idx";
  `)
  await db.execute(sql`
    ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "dependent_id";
  `)

  await db.execute(sql`DROP TABLE IF EXISTS "dependents" CASCADE;`)
}
