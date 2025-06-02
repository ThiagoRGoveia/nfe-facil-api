import { Migration } from '@mikro-orm/migrations';

export class Migration20250304184135 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "template" rename to "templates";`);

    this.addSql(
      `create table "webhooks" ("id" varchar(255) not null, "updated_at" timestamp not null default now(), "name" varchar(255) not null, "url" varchar(255) not null, "secret" varchar(255) null, "events" text[] not null, "status" text check ("status" in ('ACTIVE', 'INACTIVE')) not null default 'ACTIVE', "max_retries" int not null default 3, "timeout" int not null default 5000, "user_id" varchar(255) not null, "auth_type" text check ("auth_type" in ('NONE', 'BASIC', 'OAUTH2')) not null default 'NONE', "encrypted_config" varchar(255) null, "headers" jsonb not null, "created_at" timestamp not null default now(), constraint "webhooks_pkey" primary key ("id"));`,
    );
    this.addSql(`create index "webhooks_status_index" on "webhooks" ("status");`);

    this.addSql(
      `create table "webhook_deliveries" ("id" varchar(255) not null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), "webhook_id" varchar(255) not null, "payload" jsonb not null, "status" text check ("status" in ('PENDING', 'SUCCESS', 'FAILED', 'RETRY_PENDING', 'RETRYING')) not null default 'PENDING', "retry_count" int not null default 0, "last_error" varchar(255) null, "last_attempt" timestamptz null, "next_attempt" timestamptz null, constraint "webhook_deliveries_pkey" primary key ("id"));`,
    );

    this.addSql(
      `alter table "templates" add constraint "templates_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "webhooks" add constraint "webhooks_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "webhook_deliveries" add constraint "webhook_deliveries_webhook_id_foreign" foreign key ("webhook_id") references "webhooks" ("id") on update cascade;`,
    );

    this.addSql(`alter table "public_file_processes" drop constraint "public_file_processes_template_id_foreign";`);

    this.addSql(`alter table "batch_processes" drop constraint "batch_processes_template_id_foreign";`);

    this.addSql(`alter table "document_processes" drop constraint "document_processes_template_id_foreign";`);

    this.addSql(
      `alter table "public_file_processes" add constraint "public_file_processes_template_id_foreign" foreign key ("template_id") references "templates" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "batch_processes" add constraint "batch_processes_template_id_foreign" foreign key ("template_id") references "templates" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "document_processes" add constraint "document_processes_template_id_foreign" foreign key ("template_id") references "templates" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `create table "template" ("id" varchar(255) not null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), "name" varchar(255) not null, "process_code" varchar(255) not null, "metadata" jsonb not null, "output_format" varchar(255) not null, "is_public" boolean not null, "user_id" varchar(255) null, constraint "template_pkey" primary key ("id"));`,
    );

    this.addSql(
      `alter table "template" add constraint "template_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete set null;`,
    );

    this.addSql(`alter table "public_file_processes" drop constraint "public_file_processes_template_id_foreign";`);

    this.addSql(`alter table "batch_processes" drop constraint "batch_processes_template_id_foreign";`);

    this.addSql(`alter table "document_processes" drop constraint "document_processes_template_id_foreign";`);

    this.addSql(
      `alter table "public_file_processes" add constraint "public_file_processes_template_id_foreign" foreign key ("template_id") references "template" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "batch_processes" add constraint "batch_processes_template_id_foreign" foreign key ("template_id") references "template" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "document_processes" add constraint "document_processes_template_id_foreign" foreign key ("template_id") references "template" ("id") on update cascade;`,
    );
  }
}
