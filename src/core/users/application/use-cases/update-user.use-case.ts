import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { User } from '@/core/users/domain/entities/user.entity';
import { UserDbPort } from '../ports/users-db.port';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PinoLogger } from 'nestjs-pino';

interface UpdateUserInput {
  id: User['id'];
  data: UpdateUserDto;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userDb: UserDbPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute({ id, data }: UpdateUserInput): Promise<User> {
    try {
      const user = await this.userDb.exists(id);
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      const updatedUser = this.userDb.update(id, data);
      await this.userDb.save();
      return updatedUser;
    } catch (error) {
      this.logger.error({ err: error, userId: id }, 'Failed to update user');
      throw new InternalServerErrorException('Failed to update user in database');
    }
  }
}
