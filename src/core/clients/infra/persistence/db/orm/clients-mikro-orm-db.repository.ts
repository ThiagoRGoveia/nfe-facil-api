import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { ClientDbPort } from '../../../application/ports/client-db.port';
import { Client } from '../../../domain/entities/client.entity';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';

@Injectable()
export class ClientMikroOrmDbRepository extends EntityRepository(Client) implements ClientDbPort {
  constructor(private readonly em: EntityManager) {}
}
