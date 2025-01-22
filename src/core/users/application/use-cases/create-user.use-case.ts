import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDbPort } from '../ports/users-db.port';
import { CreateUserDto } from '../dtos/create-user.dto';
import { User } from '../../domain/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute(data: CreateUserDto): Promise<User> {
    try {
      const user = this.userDb.create(data);
      await this.userDb.save();
      return user;
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw new BadRequestException('Failed to create user in database');
    }
  }
}
