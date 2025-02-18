import { Migration } from '@mikro-orm/migrations';

export class Migration20250218143135 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("id" varchar(255) not null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), "name" varchar(255) null, "surname" varchar(255) null, "email" varchar(255) null, "client_id" varchar(255) not null, "client_secret" varchar(255) not null, "credits" int not null, "payment_external_id" varchar(255) null, "auth0id" varchar(255) not null, "role" text check ("role" in ('admin', 'customer')) not null, "is_social" boolean not null default false, constraint "user_pkey" primary key ("id"));`);

    this.addSql(`create table "template" ("id" varchar(255) not null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), "name" varchar(255) not null, "process_code" varchar(255) not null, "metadata" jsonb not null, "output_format" varchar(255) not null, "is_public" boolean not null, "user_id" varchar(255) null, constraint "template_pkey" primary key ("id"));`);

    this.addSql(`create table "batch_processes" ("id" varchar(255) not null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), "status" text check ("status" in ('CREATED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED')) not null, "template_id" varchar(255) not null, "user_id" varchar(255) not null, "total_files" int not null default 0, "processed_files" int not null default 0, "json_results" varchar(255) null, "csv_results" varchar(255) null, "excel_results" varchar(255) null, constraint "batch_processes_pkey" primary key ("id"));`);

    this.addSql(`create table "document_processes" ("id" varchar(255) not null, "template_id" varchar(255) not null, "file_name" varchar(255) not null, "file_path" varchar(255) null, "result" jsonb null, "status" text check ("status" in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) not null, "error" varchar(255) null, "notified_at" timestamptz null, "batch_process_id" varchar(255) null, "user_id" varchar(255) not null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), constraint "document_processes_pkey" primary key ("id"));`);
    this.addSql(`create index "document_processes_template_id_index" on "document_processes" ("template_id");`);
    this.addSql(`create index "document_processes_user_id_index" on "document_processes" ("user_id");`);
    this.addSql(`create index "document_processes_created_at_batch_process_id_index" on "document_processes" ("created_at", "batch_process_id");`);

    this.addSql(`alter table "template" add constraint "template_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "batch_processes" add constraint "batch_processes_template_id_foreign" foreign key ("template_id") references "template" ("id") on update cascade;`);
    this.addSql(`alter table "batch_processes" add constraint "batch_processes_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "document_processes" add constraint "document_processes_template_id_foreign" foreign key ("template_id") references "template" ("id") on update cascade;`);
    this.addSql(`alter table "document_processes" add constraint "document_processes_batch_process_id_foreign" foreign key ("batch_process_id") references "batch_processes" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "document_processes" add constraint "document_processes_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
  }

}
