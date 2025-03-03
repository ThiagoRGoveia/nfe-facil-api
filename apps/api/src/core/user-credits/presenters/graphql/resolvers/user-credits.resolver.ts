// import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
// import { UserCredit } from '../../../domain/entities/user-credit.entity';
// import { CreateUserCreditDto } from '../../../application/dtos/create-user-credit.dto';
// import { UpdateUserCreditDto } from '../../../application/dtos/update-user-credit.dto';
// import { UserCreditsDbPort } from '../../../application/ports/user-credits-db.port';
// import { PaginatedResponse } from '@/infra/types/paginated-response.type';
// import { PaginatedGraphqlResponse } from '@/infra/graphql/factories/paginated-response.factory';
// import { Filters } from '@/infra/dtos/filter.dto';
// import { Pagination } from '@/infra/dtos/pagination.dto';
// import { Sort } from '@/infra/dtos/sort.dto';

// const PaginatedUserCredits = PaginatedGraphqlResponse(UserCredit);

// @Resolver(() => UserCredit)
// export class UserCreditsResolver {
//   constructor(private readonly userCreditDbPort: UserCreditsDbPort) {}

//   @Query(() => UserCredit, { nullable: true })
//   async findUserCreditById(@Args('id', { type: () => Number }) id: number): Promise<UserCredit | null> {
//     return this.userCreditDbPort.findById(id);
//   }

//   @Query(() => PaginatedUserCredits)
//   async findAllUserCredits(
//     @Args('filters', { nullable: true }) filters?: Filters,
//     @Args('pagination', { nullable: true }) pagination?: Pagination,
//     @Args('sort', { nullable: true }) sort?: Sort,
//   ): Promise<PaginatedResponse<UserCredit>> {
//     return this.userCreditDbPort.findAll(filters?.filters, pagination, sort);
//   }
// }
