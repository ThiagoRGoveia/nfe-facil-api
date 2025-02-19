import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { UserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { TemplateFactory } from '@/core/templates/infra/tests/factories/templates.factory';
import { BatchProcessFactory } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { FileProcessFactory } from '@/core/documents/infra/tests/factories/file-process.factory';
import { UserRole } from '@/core/users/domain/entities/user.entity';
import { BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { FileProcessStatus } from '@/core/documents/domain/entities/file-process.entity';

export class DevSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // Create the specific user
    const user = new UserFactory(em).makeOne({
      id: '19198a71-88e6-466b-aed0-5f577cce77f2',
      createdAt: new Date('2025-02-18 14:36:17.075122'),
      updatedAt: new Date('2025-02-18 14:36:17.075122'),
      name: 'Thiago',
      surname: 'Goveia',
      email: 't.r.goveia@gmail.com',
      clientId: 'a8b74890-1562-4be6-8986-bd370f03dc79',
      clientSecret: 'DX4HEUYNCEWEYTJ0NOHA7HYL7LDHW04IFWBJ',
      credits: 0,
      auth0Id: 'google-oauth2|102460736608636046370',
      role: UserRole.CUSTOMER,
      isSocial: true,
    });

    // Create the NFE JSON template
    const template = new TemplateFactory(em).makeOne({
      name: 'nfe-json',
      isPublic: true,
      processCode: 'nfe-json',
      metadata: {
        fields: ['accessKey', 'emissionDate', 'value'],
      },
      outputFormat: 'json',
    });

    // Create 5 batch processes with 50 files each
    for (let i = 0; i < 5; i++) {
      const batch = new BatchProcessFactory(em).makeOne({
        status: BatchStatus.COMPLETED,
        processedFiles: 50,
        totalFiles: 50,
        user,
        template,
      });

      // Create 50 files for each batch
      for (let j = 0; j < 50; j++) {
        new FileProcessFactory(em).makeOne({
          status: FileProcessStatus.COMPLETED,
          batchProcess: batch,
          user,
          template,
          fileName: `file-${j + 1}.xml`,
          result: {
            accessKey: '12345678901234567890123456789012345678901234',
            emissionDate: new Date().toISOString(),
            value: 1000.0,
          },
        });
      }
    }

    // Persist all entities
    await em.persistAndFlush([user, template]);
  }
}
