import { Migration } from '@mikro-orm/migrations';

export class Migration20250220160832 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "public_file_processes" ("id" varchar(255) not null, "template_id" varchar(255) not null, "file_name" varchar(255) not null, "file_path" varchar(255) not null, "result" jsonb null, "status" text check ("status" in ('COMPLETED', 'FAILED')) not null, "error" varchar(255) null, "created_at" timestamp not null default now(), "updated_at" timestamp not null default now(), constraint "public_file_processes_pkey" primary key ("id"));`);
    this.addSql(`create index "public_file_processes_template_id_index" on "public_file_processes" ("template_id");`);

    this.addSql(`alter table "public_file_processes" add constraint "public_file_processes_template_id_foreign" foreign key ("template_id") references "template" ("id") on update cascade;`);
  }

}
