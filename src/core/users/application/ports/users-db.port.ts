import { User } from '../../domain/entities/user.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export abstract class UserDbPort extends BaseDbPort<User> {
  abstract create(data: CreateUserDto): User;
  abstract update(user: User, data: UpdateUserDto): User;
}
