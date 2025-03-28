import { Global, Module, DynamicModule, Inject, Optional } from '@nestjs/common';
import { TemplateDbPort } from './application/ports/templates-db.port';
import { TemplateMikroOrmDbRepository } from './infra/persistence/db/orm/templates-mikro-orm-db.repository';
import { CreateTemplateUseCase } from './application/use-cases/create-template.use-case';
import { UpdateTemplateUseCase } from './application/use-cases/update-template.use-case';
import { DeleteTemplateUseCase } from './application/use-cases/delete-template.use-case';
import { TemplatesResolver } from './presenters/graphql/resolvers/templates.resolver';
import { TemplateController } from './presenters/rest/controllers/templates.controller';

const controllers = [TemplateController];
const resolvers = [TemplatesResolver];
const defaultProviders = [
  {
    provide: TemplateDbPort,
    useClass: TemplateMikroOrmDbRepository,
  },
  CreateTemplateUseCase,
  UpdateTemplateUseCase,
  DeleteTemplateUseCase,
];

@Global()
@Module({
  // providers: [...defaultProviders, ...resolvers],
  // exports: [TemplateDbPort, CreateTemplateUseCase, UpdateTemplateUseCase, DeleteTemplateUseCase],
})
export class TemplatesModule {
  static register(@Optional() @Inject('API_TYPE') apiType: 'rest' | 'graphql' | 'all' | 'none' = 'all'): DynamicModule {
    // Combine resolvers and other providers
    const providers = [...(apiType === 'graphql' || apiType === 'all' ? resolvers : []), ...defaultProviders];

    return {
      module: TemplatesModule,
      controllers: apiType !== 'none' && apiType !== 'graphql' ? controllers : [],
      providers,
      exports: [TemplateDbPort, CreateTemplateUseCase, UpdateTemplateUseCase, DeleteTemplateUseCase],
    };
  }
}

export { TemplateDbPort, CreateTemplateUseCase, UpdateTemplateUseCase, DeleteTemplateUseCase, TemplatesResolver };
