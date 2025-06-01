import { Global, Module, DynamicModule, Inject, Optional } from '@nestjs/common';
import { TemplateDbPort } from './core/application/ports/templates-db.port';
import { TemplateMikroOrmDbRepository } from './core/infra/persistence/db/orm/templates-mikro-orm-db.repository';
import { CreateTemplateUseCase } from './core/application/use-cases/create-template.use-case';
import { UpdateTemplateUseCase } from './core/application/use-cases/update-template.use-case';
import { DeleteTemplateUseCase } from './core/application/use-cases/delete-template.use-case';
import { TemplatesResolver } from './core/presenters/graphql/resolvers/templates.resolver';
import { TemplateController } from './core/presenters/rest/controllers/templates.controller';

const controllers = [];
const resolvers = [];
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

export {
  TemplateDbPort,
  CreateTemplateUseCase,
  UpdateTemplateUseCase,
  DeleteTemplateUseCase,
  TemplatesResolver,
  TemplateController,
};
