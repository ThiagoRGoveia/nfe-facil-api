import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDbPort } from '../ports/users-db.port';
import { CreateUserDto } from '../dtos/create-user.dto';
import { User } from '../../domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { SecretAdapter } from '@/infra/adapters/secret.adapter';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
    private readonly uuidAdapter: UuidAdapter,
    private readonly secretAdapter: SecretAdapter,
  ) {}

  async execute(data: CreateUserDto): Promise<User> {
    try {
      const user = this.userDb.create({
        ...data,
        clientId: this.uuidAdapter.generate(),
        clientSecret: this.secretAdapter.generate(),
      });

      await this.userDb.save();
      return user;
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw new BadRequestException('Failed to create user in database');
    }
  }
}
