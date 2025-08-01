import { PublicFileProcess } from '../../domain/entities/public-file-process.entity';
import { BaseDbPort } from '@lib/commons/core/ports/_base-db-port';

export abstract class PublicFileProcessDbPort extends BaseDbPort<PublicFileProcess> {
  abstract findByIds(ids: string[]): Promise<PublicFileProcess[]>;
  abstract deleteOlderThan(date: Date): Promise<void>;
}
