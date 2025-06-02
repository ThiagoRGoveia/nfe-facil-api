import { User } from '@lib/users/core/domain/entities/user.entity';
import { Request as ExpressRequest } from 'express';

export interface Request extends ExpressRequest {
  user: User;
}
