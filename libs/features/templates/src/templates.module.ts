import { Global, Module } from '@nestjs/common';
import { TemplateDbPort } from './core/application/ports/templates-db.port';
import { TemplateMikroOrmDbRepository } from './core/infra/persistence/db/orm/templates-mikro-orm-db.repository';
import { CreateTemplateUseCase } from './core/application/use-cases/create-template.use-case';
import { UpdateTemplateUseCase } from './core/application/use-cases/update-template.use-case';
import { DeleteTemplateUseCase } from './core/application/use-cases/delete-template.use-case';

@Global()
@Module({
  providers: [
    {
      provide: TemplateDbPort,
      useClass: TemplateMikroOrmDbRepository,
    },
    CreateTemplateUseCase,
    UpdateTemplateUseCase,
    DeleteTemplateUseCase,
  ],
  exports: [TemplateDbPort, CreateTemplateUseCase, UpdateTemplateUseCase, DeleteTemplateUseCase],
})
export class TemplatesModule {}
