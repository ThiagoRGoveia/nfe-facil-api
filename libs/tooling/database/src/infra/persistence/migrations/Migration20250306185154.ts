import { Migration } from '@mikro-orm/migrations';

export class Migration20250306185154 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "credit_transactions" ("id" varchar(255) not null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), "user_id" varchar(255) not null, "type" text check ("type" in ('purchase', 'top-up', 'subscription', 'refund')) not null, "amount" int not null, "balance_before" int not null, "balance_after" int not null, "status" text check ("status" in ('successful', 'failed', 'pending')) not null, "external_operation_id" varchar(255) null, "subscription_id" varchar(255) null, "metadata" jsonb null, constraint "credit_transactions_pkey" primary key ("id"));`);

    this.addSql(`create table "credit_subscriptions" ("id" varchar(255) not null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), "user_id" varchar(255) not null, "credit_amount" int not null, "interval" text check ("interval" in ('monthly', 'quarterly', 'yearly')) not null, "status" text check ("status" in ('active', 'cancelled', 'suspended', 'failed')) not null default 'active', "external_subscription_id" varchar(255) null, "next_renewal_date" timestamptz not null, "cancelled_at" timestamptz null, constraint "credit_subscriptions_pkey" primary key ("id"));`);

    this.addSql(`create table "file_records" ("id" varchar(255) not null, "template_id" varchar(255) not null, "file_name" varchar(255) not null, "file_path" varchar(255) null, "result" jsonb null, "status" text check ("status" in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) not null, "error" varchar(255) null, "notified_at" timestamptz null, "batch_process_id" varchar(255) null, "user_id" varchar(255) not null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), constraint "file_records_pkey" primary key ("id"));`);
    this.addSql(`create index "file_records_template_id_index" on "file_records" ("template_id");`);
    this.addSql(`create index "file_records_user_id_index" on "file_records" ("user_id");`);
    this.addSql(`create index "file_records_created_at_batch_process_id_index" on "file_records" ("created_at", "batch_process_id");`);

    this.addSql(`alter table "credit_transactions" add constraint "credit_transactions_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "credit_subscriptions" add constraint "credit_subscriptions_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "file_records" add constraint "file_records_template_id_foreign" foreign key ("template_id") references "templates" ("id") on update cascade;`);
    this.addSql(`alter table "file_records" add constraint "file_records_batch_process_id_foreign" foreign key ("batch_process_id") references "batch_processes" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "file_records" add constraint "file_records_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "document_processes" ("id" varchar(255) not null, "template_id" varchar(255) not null, "file_name" varchar(255) not null, "file_path" varchar(255) null, "result" jsonb null, "status" text check ("status" in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) not null, "error" varchar(255) null, "notified_at" timestamptz null, "batch_process_id" varchar(255) null, "user_id" varchar(255) not null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), constraint "document_processes_pkey" primary key ("id"));`);
    this.addSql(`create index "document_processes_template_id_index" on "document_processes" ("template_id");`);
    this.addSql(`create index "document_processes_user_id_index" on "document_processes" ("user_id");`);
    this.addSql(`create index "document_processes_created_at_batch_process_id_index" on "document_processes" ("created_at", "batch_process_id");`);

    this.addSql(`alter table "document_processes" add constraint "document_processes_template_id_foreign" foreign key ("template_id") references "templates" ("id") on update cascade;`);
    this.addSql(`alter table "document_processes" add constraint "document_processes_batch_process_id_foreign" foreign key ("batch_process_id") references "batch_processes" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "document_processes" add constraint "document_processes_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "user" add column "payment_external_id" varchar(255) null;`);
  }

}
