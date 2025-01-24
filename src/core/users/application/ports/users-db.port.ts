import { User } from '../../domain/entities/user.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export type DtoWithClientCredentials<T> = T & {
  clientId: string;
  clientSecret: string;
};

export abstract class UserDbPort extends BaseDbPort<User> {
  abstract create(data: DtoWithClientCredentials<CreateUserDto>): User;
  abstract update(id: User['id'], data: Partial<DtoWithClientCredentials<UpdateUserDto>>): User;
  abstract findByClientId(clientId: string): Promise<User | null>;
}
