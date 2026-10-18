import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261018035301 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "scholar" drop constraint if exists "scholar_email_unique";`);
    this.addSql(`create table if not exists "earn_application" ("id" text not null, "project_id" text not null, "scholar_id" text not null, "message" text null, "proposed_amount" real null, "proposed_days" integer null, "status" text check ("status" in ('pending', 'accepted', 'rejected', 'withdrawn')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "earn_application_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_application_project_id" ON "earn_application" ("project_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_application_scholar_id" ON "earn_application" ("scholar_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_application_deleted_at" ON "earn_application" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "earn_payout" ("id" text not null, "scholar_id" text not null, "project_id" text null, "amount" real not null, "currency" text not null default 'PKR', "status" text check ("status" in ('pending', 'paid', 'cancelled')) not null default 'pending', "method" text null, "reference" text null, "paid_at" timestamptz null, "note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "earn_payout_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_payout_scholar_id" ON "earn_payout" ("scholar_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_payout_project_id" ON "earn_payout" ("project_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_payout_deleted_at" ON "earn_payout" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "earn_project" ("id" text not null, "title" text not null, "description" text not null, "category" text check ("category" in ('translation', 'review', 'proofreading', 'typesetting', 'research', 'teaching', 'other')) not null default 'translation', "source_reference" text null, "word_count" integer null, "budget" real not null, "currency" text not null default 'PKR', "deadline" timestamptz null, "status" text check ("status" in ('draft', 'open', 'assigned', 'in_review', 'completed', 'cancelled')) not null default 'open', "assigned_scholar_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "earn_project_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_project_assigned_scholar_id" ON "earn_project" ("assigned_scholar_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_project_deleted_at" ON "earn_project" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "earn_submission" ("id" text not null, "project_id" text not null, "scholar_id" text not null, "note" text null, "work_url" text not null, "status" text check ("status" in ('submitted', 'approved', 'changes_requested')) not null default 'submitted', "feedback" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "earn_submission_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_submission_project_id" ON "earn_submission" ("project_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_submission_scholar_id" ON "earn_submission" ("scholar_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_submission_deleted_at" ON "earn_submission" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "scholar" ("id" text not null, "email" text not null, "full_name" text not null, "phone" text null, "country" text null, "specialties" text null, "payout_method" text null, "payout_details" text null, "status" text check ("status" in ('invited', 'active', 'suspended')) not null default 'invited', "customer_id" text null, "admin_notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "scholar_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_scholar_email_unique" ON "scholar" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_scholar_customer_id" ON "scholar" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_scholar_deleted_at" ON "scholar" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "earn_application" cascade;`);

    this.addSql(`drop table if exists "earn_payout" cascade;`);

    this.addSql(`drop table if exists "earn_project" cascade;`);

    this.addSql(`drop table if exists "earn_submission" cascade;`);

    this.addSql(`drop table if exists "scholar" cascade;`);
  }

}
