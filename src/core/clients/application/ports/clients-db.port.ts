import { Client } from '../../domain/entities/client.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';

export abstract class ClientDbPort extends BaseDbPort<Client> {}
