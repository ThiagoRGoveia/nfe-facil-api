import { Global, Module } from '@nestjs/common';
import { ClientDbPort } from './application/ports/client-db.port';
import { ClientMikroOrmDbRepository } from './infra/persistence/db/orm/client-mikro-orm-db.repository';
import { ClientResolver } from './presenters/graphql/resolvers/client.resolver';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from './application/use-cases/delete-client.use-case';

@Global()
@Module({
  providers: [
    ClientResolver,
    {
      provide: ClientDbPort,
      useClass: ClientMikroOrmDbRepository,
    },
    CreateClientUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
  ],
  exports: [ClientDbPort, CreateClientUseCase],
})
export class ClientsModule {}

export { ClientDbPort, CreateClientUseCase, UpdateClientUseCase, DeleteClientUseCase, ClientResolver };
