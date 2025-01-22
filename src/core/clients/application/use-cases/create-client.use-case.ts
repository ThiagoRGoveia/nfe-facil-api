import { Injectable } from '@nestjs/common';
import { User } from '@/core/users/domain/entities/user.entity';
import { Client } from '../../domain/entities/client.entity';
import { ClientDbPort } from '../ports/client-db.port';
import { CreateClientDto } from '../dtos/create-client.dto';

interface CreateClientInput {
  user: User;
  data: CreateClientDto;
}

@Injectable()
export class CreateClientUseCase {
  constructor(private readonly clientDbPort: ClientDbPort) {}

  async execute({ user, data }: CreateClientInput): Promise<Client> {
    // TODO: Implement create logic
  }
}
