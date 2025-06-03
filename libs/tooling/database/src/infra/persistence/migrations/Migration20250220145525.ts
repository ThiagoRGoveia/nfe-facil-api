import { Migration } from '@mikro-orm/migrations';

export class Migration20250220145525 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create index "user_client_id_index" on "user" ("client_id");`);
    this.addSql(`alter table "user" add constraint "user_client_id_unique" unique ("client_id");`);
    this.addSql(`alter table "user" add constraint "user_auth0id_unique" unique ("auth0id");`);

    this.addSql(`alter table "batch_processes" add column "requested_formats" text[] not null default '{json}';`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "user_client_id_index";`);
    this.addSql(`alter table "user" drop constraint "user_client_id_unique";`);
    this.addSql(`alter table "user" drop constraint "user_auth0id_unique";`);
  }

}
