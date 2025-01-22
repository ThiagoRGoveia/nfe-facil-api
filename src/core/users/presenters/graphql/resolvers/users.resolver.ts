import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from '../../../domain/entities/user.entity';
import { CreateUserDto } from '../../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../../application/dtos/update-user.dto';
import { UserDbPort } from '../../../application/ports/users-db.port';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../../application/use-cases/delete-user.use-case';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly userDbPort: UserDbPort,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Query(() => User, { nullable: true })
  async findUserById(@Args('id', { type: () => Number }) id: number): Promise<User | null> {
    return this.userDbPort.findById(id);
  }

  @Query(() => [User])
  async findAllUsers(): Promise<PaginatedResponse<User>> {
    return this.userDbPort.findAll();
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserDto): Promise<User> {
    return this.createUserUseCase.execute(input);
  }

  @Mutation(() => User)
  async updateUser(@Args('id', { type: () => Number }) id: number, @Args('input') input: UpdateUserDto): Promise<User> {
    return this.updateUserUseCase.execute({
      id,
      data: input,
    });
  }

  @Mutation(() => Boolean)
  async deleteUser(@Args('id', { type: () => Number }) id: number): Promise<boolean> {
    await this.deleteUserUseCase.execute({ id });
    return true;
  }
}
