import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserCredit } from '../../../domain/entities/user-credit.entity';
import { CreateUserCreditDto } from '../../../application/dtos/create-user-credit.dto';
import { UpdateUserCreditDto } from '../../../application/dtos/update-user-credit.dto';
import { UserCreditDbPort } from '../../../application/ports/user-credits-db.port';
import { CreateUserCreditUseCase } from '../../../application/use-cases/create-user-credit.use-case';
import { UpdateUserCreditUseCase } from '../../../application/use-cases/update-user-credit.use-case';
import { DeleteUserCreditUseCase } from '../../../application/use-cases/delete-user-credit.use-case';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { PaginatedGraphqlResponse } from '@/infra/graphql/factories/paginated-response.factory';
import { Filters } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort } from '@/infra/dtos/sort.dto';

const PaginatedUserCredits = PaginatedGraphqlResponse(UserCredit);

@Resolver(() => UserCredit)
export class UserCreditsResolver {
  constructor(
    private readonly userCreditDbPort: UserCreditDbPort,
    private readonly createUserCreditUseCase: CreateUserCreditUseCase,
    private readonly updateUserCreditUseCase: UpdateUserCreditUseCase,
    private readonly deleteUserCreditUseCase: DeleteUserCreditUseCase,
  ) {}

  @Query(() => UserCredit, { nullable: true })
  async findUserCreditById(@Args('id', { type: () => Number }) id: number): Promise<UserCredit | null> {
    return this.userCreditDbPort.findById(id);
  }

  @Query(() => PaginatedUserCredits)
  async findAllUserCredits(
    @Args('filters', { nullable: true }) filters?: Filters,
    @Args('pagination', { nullable: true }) pagination?: Pagination,
    @Args('sort', { nullable: true }) sort?: Sort,
  ): Promise<PaginatedResponse<UserCredit>> {
    return this.userCreditDbPort.findAll(filters?.filters, pagination, sort);
  }

  @Mutation(() => UserCredit)
  async createUserCredit(@Args('input') input: CreateUserCreditDto): Promise<UserCredit> {
    return this.createUserCreditUseCase.execute(input);
  }

  @Mutation(() => UserCredit)
  async updateUserCredit(
    @Args('id', { type: () => Number }) id: number,
    @Args('input') input: UpdateUserCreditDto,
  ): Promise<UserCredit> {
    return this.updateUserCreditUseCase.execute({
      id,
      data: input,
    });
  }

  @Mutation(() => Boolean)
  async deleteUserCredit(@Args('id', { type: () => Number }) id: number): Promise<boolean> {
    await this.deleteUserCreditUseCase.execute({ id });
    return true;
  }
} 