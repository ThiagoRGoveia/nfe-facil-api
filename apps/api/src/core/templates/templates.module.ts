import { Global, Module } from '@nestjs/common';
import { TemplateDbPort } from './application/ports/templates-db.port';
import { TemplateMikroOrmDbRepository } from './infra/persistence/db/orm/templates-mikro-orm-db.repository';
import { CreateTemplateUseCase } from './application/use-cases/create-template.use-case';
import { UpdateTemplateUseCase } from './application/use-cases/update-template.use-case';
import { DeleteTemplateUseCase } from './application/use-cases/delete-template.use-case';
import { TemplatesResolver } from './presenters/graphql/resolvers/templates.resolver';
import { TemplateController } from './presenters/rest/controllers/templates.controller';

@Global()
@Module({
  controllers: [TemplateController],
  providers: [
    TemplatesResolver,
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

export { TemplateDbPort, CreateTemplateUseCase, UpdateTemplateUseCase, DeleteTemplateUseCase, TemplatesResolver };
