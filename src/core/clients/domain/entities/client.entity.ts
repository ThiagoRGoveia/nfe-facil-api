import { Entity, PrimaryKey } from '@mikro-orm/core';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';

@Entity({ tableName: 'client' })
export class Client extends BaseEntity {
  @PrimaryKey()
  id: number;
}
