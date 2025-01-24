import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from '../../../domain/entities/user.entity';
import { CreateUserDto } from '../../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../../application/dtos/update-user.dto';
import { UserDbPort } from '../../../application/ports/users-db.port';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../../application/use-cases/delete-user.use-case';
import { RefreshClientSecretUseCase } from '../../../application/use-cases/refresh-client-secret.use-case';
import { PaginatedResponseType } from '@/infra/types/paginated-response.type';
import { PaginatedGraphqlResponse } from '@/infra/graphql/factories/paginated-response.factory';
import { Filters } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort } from '@/infra/dtos/sort.dto';

const PaginatedUsers = PaginatedGraphqlResponse(User);

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly userDbPort: UserDbPort,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly refreshClientSecretUseCase: RefreshClientSecretUseCase,
  ) {}

  @Query(() => User, { nullable: true })
  async findUserById(@Args('id', { type: () => Number }) id: number): Promise<User | null> {
    return this.userDbPort.findById(id);
  }

  @Query(() => PaginatedUsers)
  async findAllUsers(
    @Args('filters', { nullable: true }) filters?: Filters,
    @Args('pagination', { nullable: true }) pagination?: Pagination,
    @Args('sort', { nullable: true }) sort?: Sort,
  ): Promise<PaginatedResponseType<User>> {
    return this.userDbPort.findAll(filters?.filters, pagination, sort);
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

  @Mutation(() => User)
  async refreshUserClientSecret(@Args('id', { type: () => Number }) id: number): Promise<User> {
    return this.refreshClientSecretUseCase.execute({ id });
  }
}
