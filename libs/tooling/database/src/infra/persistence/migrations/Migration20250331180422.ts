import { Migration } from '@mikro-orm/migrations';

export class Migration20250331180422 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "templates" drop constraint "template_user_id_foreign";`);

    this.addSql(`alter table "webhook_deliveries" drop constraint "webhook_deliveries_webhook_id_foreign";`);

    this.addSql(`alter table "webhook_deliveries" add constraint "webhook_deliveries_webhook_id_foreign" foreign key ("webhook_id") references "webhooks" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "document_processes" ("id" varchar(255) not null, "template_id" varchar(255) not null, "file_name" varchar(255) not null, "file_path" varchar(255) null, "result" jsonb null, "status" text check ("status" in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) not null, "error" varchar(255) null, "notified_at" timestamptz(6) null, "batch_process_id" varchar(255) null, "user_id" varchar(255) not null, "created_at" timestamp(6) not null default now(), "updated_at" timestamp(6) not null default now(), constraint "document_processes_pkey" primary key ("id"));`);
    this.addSql(`create index "document_processes_created_at_batch_process_id_index" on "document_processes" ("created_at", "batch_process_id");`);
    this.addSql(`create index "document_processes_template_id_index" on "document_processes" ("template_id");`);
    this.addSql(`create index "document_processes_user_id_index" on "document_processes" ("user_id");`);

    this.addSql(`alter table "document_processes" add constraint "document_processes_batch_process_id_foreign" foreign key ("batch_process_id") references "batch_processes" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "document_processes" add constraint "document_processes_template_id_foreign" foreign key ("template_id") references "templates" ("id") on update cascade on delete no action;`);
    this.addSql(`alter table "document_processes" add constraint "document_processes_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete no action;`);

    this.addSql(`alter table "webhook_deliveries" drop constraint "webhook_deliveries_webhook_id_foreign";`);

    this.addSql(`alter table "templates" add constraint "template_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "user" add column "payment_external_id" varchar(255) null;`);

    this.addSql(`alter table "webhook_deliveries" add constraint "webhook_deliveries_webhook_id_foreign" foreign key ("webhook_id") references "webhooks" ("id") on update cascade on delete no action;`);
  }

}
