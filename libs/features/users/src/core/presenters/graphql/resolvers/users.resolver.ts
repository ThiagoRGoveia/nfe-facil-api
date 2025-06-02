import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from '../../../domain/entities/user.entity';
import { CreateUserDto } from '../../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../../application/dtos/update-user.dto';
import { UpdatePasswordDto } from '../../../application/dtos/update-password.dto';
import { UserDbPort } from '../../../application/ports/users-db.port';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../../application/use-cases/delete-user.use-case';
import { RefreshClientSecretUseCase } from '../../../application/use-cases/refresh-client-secret.use-case';
import { UpdatePasswordUseCase } from '../../../application/use-cases/update-password.use-case';
import { PaginatedResponse } from '@lib/commons/types/paginated-response.type';
import { PaginatedGraphqlResponse } from '@lib/commons/graphql/factories/paginated-response.factory';
import { Filters } from '@lib/commons/dtos/filter.dto';
import { Pagination } from '@lib/commons/dtos/pagination.dto';
import { Sort } from '@lib/commons/dtos/sort.dto';
import { GraphqlExpressContext } from '@lib/commons/graphql/types/context.type';
const PaginatedUsers = PaginatedGraphqlResponse(User);

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly userDbPort: UserDbPort,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly refreshClientSecretUseCase: RefreshClientSecretUseCase,
    private readonly updatePasswordUseCase: UpdatePasswordUseCase,
  ) {}

  @Query(() => User, { nullable: true })
  getUser(@Context() context: GraphqlExpressContext) {
    return context.req.user;
  }

  @Query(() => User, { nullable: true })
  async findUserById(@Args('id', { type: () => String }) id: string): Promise<User | null> {
    return this.userDbPort.findById(id);
  }

  @Query(() => PaginatedUsers)
  async findAllUsers(
    @Args('filters', { nullable: true }) filters?: Filters,
    @Args('pagination', { nullable: true }) pagination?: Pagination,
    @Args('sort', { nullable: true }) sort?: Sort,
  ): Promise<PaginatedResponse<User>> {
    return this.userDbPort.findAll(filters?.filters, pagination, sort);
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserDto): Promise<User> {
    return this.createUserUseCase.execute(input);
  }

  @Mutation(() => User)
  async updateUser(@Args('id', { type: () => String }) id: string, @Args('input') input: UpdateUserDto): Promise<User> {
    return this.updateUserUseCase.execute({
      id,
      data: input,
    });
  }

  @Mutation(() => Boolean)
  async updateUserPassword(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdatePasswordDto,
  ): Promise<boolean> {
    return this.updatePasswordUseCase.execute({
      id,
      data: input,
    });
  }

  @Mutation(() => Boolean)
  async deleteUser(@Args('id', { type: () => String }) id: string): Promise<boolean> {
    await this.deleteUserUseCase.execute({ id });
    return true;
  }

  @Mutation(() => User)
  async refreshUserClientSecret(@Args('id', { type: () => String }) id: string): Promise<User> {
    return this.refreshClientSecretUseCase.execute({ id });
  }
}
