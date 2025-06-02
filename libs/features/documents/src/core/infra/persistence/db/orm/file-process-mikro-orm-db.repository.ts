import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@lib/database/infra/persistence/repositories/_base-mikro-orm-db.repository';
import { FileRecord, FileProcessStatus } from '@lib/documents/core/domain/entities/file-records.entity';
import { Readable } from 'stream';
import { FileProcessDbPort } from '@lib/documents/core/application/ports/file-process-db.port';

@Injectable()
export class FileProcessMikroOrmDbRepository extends EntityRepository(FileRecord) implements FileProcessDbPort {
  async findByBatchPaginated(batchId: string, limit: number, offset: number): Promise<FileRecord[]> {
    return this.em.find(FileRecord, { batchProcess: { id: batchId } }, { offset, limit });
  }

  findByBatchPaginatedAndStatus(
    batchId: string,
    status: FileProcessStatus,
    limit: number,
    offset: number,
  ): Promise<FileRecord[]> {
    return this.em.find(FileRecord, { batchProcess: { id: batchId }, status }, { offset, limit });
  }

  async deleteByBatchId(batchId: string): Promise<void> {
    await this.em.nativeDelete(FileRecord, { batchProcess: { id: batchId } });
  }

  async countByBatchAndStatus(batchId: string, status: FileProcessStatus): Promise<number> {
    return this.em.count(FileRecord, { batchProcess: { id: batchId }, status });
  }

  findCompletedByBatchStream(batchId: string, limit: number): Readable {
    const stream = new Readable({
      objectMode: true,
      read() {}, // Implementation handled by pushing data
    });

    // Start the async process of fetching and pushing data
    this.streamResults(batchId, limit, stream).catch((error) => {
      stream.emit('error', error);
    });

    return stream;
  }

  private async streamResults(batchId: string, limit: number, stream: Readable): Promise<void> {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const results = await this.em.getConnection().execute(
        `
        SELECT result 
        FROM file_records 
        WHERE batch_process_id = ? 
        AND status = ? 
        AND result IS NOT NULL
        ORDER BY created_at ASC
        LIMIT ? OFFSET ?
      `,
        [batchId, FileProcessStatus.COMPLETED, limit, offset],
      );

      if (results.length === 0) {
        hasMore = false;
      } else {
        for (const row of results) {
          const canPush = stream.push(row.result);
          if (!canPush) {
            // Wait for the stream to drain if the buffer is full
            await new Promise((resolve) => stream.once('drain', resolve));
          }
        }
        offset += limit;
      }
    }
    stream.push(null); // Signal end of stream
  }
}
