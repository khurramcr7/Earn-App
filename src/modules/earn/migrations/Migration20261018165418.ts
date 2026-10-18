import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261018165418 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "earn_partner" drop constraint if exists "earn_partner_email_unique";`);
    this.addSql(`create table if not exists "earn_book_project" ("id" text not null, "title" text not null, "title_ar" text null, "description" text not null, "source_reference" text null, "publisher_id" text null, "author_id" text null, "funding_model" text check ("funding_model" in ('profit_share', 'sponsorship')) not null default 'profit_share', "funding_goal" numeric not null, "currency" text not null default 'PKR', "investor_profit_share_pct" real null, "author_royalty_pct" real null, "agreement_url" text null, "status" text check ("status" in ('proposed', 'draft', 'fundraising', 'funded', 'in_production', 'published', 'closed', 'cancelled')) not null default 'draft', "proposed_by_partner_id" text null, "published_at" timestamptz null, "admin_notes" text null, "raw_funding_goal" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "earn_book_project_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_book_project_publisher_id" ON "earn_book_project" ("publisher_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_book_project_author_id" ON "earn_book_project" ("author_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_book_project_deleted_at" ON "earn_book_project" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "earn_commitment" ("id" text not null, "book_project_id" text not null, "partner_id" text not null, "amount" numeric not null, "currency" text not null default 'PKR', "status" text check ("status" in ('pledged', 'received', 'refunded', 'cancelled')) not null default 'pledged', "reference" text null, "received_at" timestamptz null, "note" text null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "earn_commitment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_commitment_book_project_id" ON "earn_commitment" ("book_project_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_commitment_partner_id" ON "earn_commitment" ("partner_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_commitment_deleted_at" ON "earn_commitment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "earn_distribution" ("id" text not null, "book_project_id" text not null, "sales_report_id" text null, "partner_id" text not null, "kind" text check ("kind" in ('investor_profit', 'author_royalty', 'capital_refund')) not null, "amount" numeric not null, "currency" text not null default 'PKR', "status" text check ("status" in ('pending', 'paid', 'cancelled')) not null default 'pending', "method" text null, "reference" text null, "paid_at" timestamptz null, "note" text null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "earn_distribution_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_distribution_book_project_id" ON "earn_distribution" ("book_project_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_distribution_sales_report_id" ON "earn_distribution" ("sales_report_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_distribution_partner_id" ON "earn_distribution" ("partner_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_distribution_deleted_at" ON "earn_distribution" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "earn_partner" ("id" text not null, "email" text not null, "full_name" text not null, "organization" text null, "phone" text null, "country" text null, "is_investor" boolean not null default false, "is_publisher" boolean not null default false, "is_author" boolean not null default false, "payout_method" text null, "payout_details" text null, "status" text check ("status" in ('invited', 'active', 'suspended')) not null default 'invited', "customer_id" text null, "admin_notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "earn_partner_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_earn_partner_email_unique" ON "earn_partner" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_partner_customer_id" ON "earn_partner" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_partner_deleted_at" ON "earn_partner" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "earn_sales_report" ("id" text not null, "book_project_id" text not null, "period_start" timestamptz not null, "period_end" timestamptz not null, "units_sold" integer not null default 0, "revenue" numeric not null, "costs" numeric not null default 0, "currency" text not null default 'PKR', "status" text check ("status" in ('submitted', 'approved', 'rejected')) not null default 'submitted', "submitted_by_partner_id" text null, "note" text null, "admin_feedback" text null, "net_profit" numeric null, "calculation" jsonb null, "raw_revenue" jsonb not null, "raw_costs" jsonb not null default '{"value":"0","precision":20}', "raw_net_profit" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "earn_sales_report_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_sales_report_book_project_id" ON "earn_sales_report" ("book_project_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_sales_report_deleted_at" ON "earn_sales_report" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "earn_project" drop constraint if exists "earn_project_category_check";`);

    this.addSql(`alter table if exists "earn_project" add column if not exists "book_project_id" text null;`);
    this.addSql(`alter table if exists "earn_project" add constraint "earn_project_category_check" check("category" in ('translation', 'review', 'proofreading', 'typesetting', 'publishing', 'printing', 'fatwa', 'research', 'teaching', 'other'));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_earn_project_book_project_id" ON "earn_project" ("book_project_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "earn_book_project" cascade;`);

    this.addSql(`drop table if exists "earn_commitment" cascade;`);

    this.addSql(`drop table if exists "earn_distribution" cascade;`);

    this.addSql(`drop table if exists "earn_partner" cascade;`);

    this.addSql(`drop table if exists "earn_sales_report" cascade;`);

    this.addSql(`alter table if exists "earn_project" drop constraint if exists "earn_project_category_check";`);

    this.addSql(`drop index if exists "IDX_earn_project_book_project_id";`);
    this.addSql(`alter table if exists "earn_project" drop column if exists "book_project_id";`);

    this.addSql(`alter table if exists "earn_project" add constraint "earn_project_category_check" check("category" in ('translation', 'review', 'proofreading', 'typesetting', 'research', 'teaching', 'other'));`);
  }

}
