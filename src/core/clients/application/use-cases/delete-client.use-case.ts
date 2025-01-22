import { Injectable } from '@nestjs/common';
import { User } from '@/core/users/domain/entities/user.entity';
import { Client } from '../../domain/entities/client.entity';
import { ClientDbPort } from '../ports/client-db.port';

interface deleteClientInput {
  user: User;
}

@Injectable()
export class deleteClientUseCase {
  constructor(private readonly clientDbPort: ClientDbPort) {}

  async execute(): Promise<Client | void> {
    // TODO: Implement delete logic
  }
}
