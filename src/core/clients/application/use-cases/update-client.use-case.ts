import { Injectable } from '@nestjs/common';
import { User } from '@/core/users/domain/entities/user.entity';
import { Client } from '../../domain/entities/client.entity';
import { ClientDbPort } from '../ports/client-db.port';
import { UpdateClientDto } from '../dtos/update-client.dto';

interface UpdateClientInput {
  user: User;
  id: string;
  data: UpdateClientDto;
}

@Injectable()
export class UpdateClientUseCase {
  constructor(private readonly clientDbPort: ClientDbPort) {}

  async execute({ user, id, data }: UpdateClientInput): Promise<Client> {
    // TODO: Implement update logic
  }
}
