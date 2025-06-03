import { Migration } from '@mikro-orm/migrations';

export class Migration20250331180623 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "webhook_deliveries" alter column "webhook_id" type varchar(255) using ("webhook_id"::varchar(255));`);
    this.addSql(`alter table "webhook_deliveries" alter column "webhook_id" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "webhook_deliveries" alter column "webhook_id" type varchar(255) using ("webhook_id"::varchar(255));`);
    this.addSql(`alter table "webhook_deliveries" alter column "webhook_id" set not null;`);
  }

}
