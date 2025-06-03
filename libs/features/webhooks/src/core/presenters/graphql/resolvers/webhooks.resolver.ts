import { Args, Mutation, Query, Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';
import { Webhook } from '../../../domain/entities/webhook.entity';
import { CreateWebhookDto } from '../../../application/dtos/create-webhook.dto';
import { UpdateWebhookDto } from '../../../application/dtos/update-webhook.dto';
import { CreateWebhookUseCase } from '../../../application/use-cases/create-webhook.use-case';
import { UpdateWebhookUseCase } from '../../../application/use-cases/update-webhook.use-case';
import { DeleteWebhookUseCase } from '../../../application/use-cases/delete-webhook.use-case';
import { PaginatedResponse } from '@lib/commons/types/paginated-response.type';
import { PaginatedGraphqlResponse } from '@lib/commons/graphql/factories/paginated-response.factory';
import { Filters } from '@lib/commons/dtos/filter.dto';
import { Pagination } from '@lib/commons/dtos/pagination.dto';
import { Sort } from '@lib/commons/dtos/sort.dto';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { GraphqlExpressContext } from '@lib/commons/graphql/types/context.type';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { WebhookDbPort } from '@lib/webhooks/core/application/ports/webhook-db.port';

const PaginatedWebhooks = PaginatedGraphqlResponse(Webhook);

@Resolver(() => Webhook)
export class WebhooksResolver {
  constructor(
    private readonly webhookDbPort: WebhookDbPort,
    private readonly createWebhookUseCase: CreateWebhookUseCase,
    private readonly updateWebhookUseCase: UpdateWebhookUseCase,
    private readonly deleteWebhookUseCase: DeleteWebhookUseCase,
  ) {}

  @Query(() => Webhook, { nullable: true })
  findWebhookById(@Args('id', { type: () => String }) id: string): Promise<Webhook | null> {
    return this.webhookDbPort.findByIdOrFail(id);
  }

  @Query(() => PaginatedWebhooks)
  findAllWebhooks(
    @Context() context: GraphqlExpressContext,
    @Args('filters', { nullable: true }) filters?: Filters,
    @Args('pagination', { nullable: true }) pagination?: Pagination,
    @Args('sort', { nullable: true }) sort?: Sort,
  ): Promise<PaginatedResponse<Webhook>> {
    if (context.req.user.role === UserRole.ADMIN) {
      return this.webhookDbPort.findAll(filters?.filters, pagination, sort);
    } else {
      return this.webhookDbPort.findByUser(context.req.user.id, filters?.filters, pagination, sort);
    }
  }

  @Mutation(() => Webhook)
  async createWebhook(
    @Context() context: GraphqlExpressContext,
    @Args('input') input: CreateWebhookDto,
  ): Promise<Webhook> {
    return this.createWebhookUseCase.execute({
      user: context.req.user,
      data: input,
    });
  }

  @Mutation(() => Webhook)
  async updateWebhook(
    @Context() context: GraphqlExpressContext,
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdateWebhookDto,
  ): Promise<Webhook> {
    return this.updateWebhookUseCase.execute({
      user: context.req.user,
      id,
      data: input,
    });
  }

  @Mutation(() => Boolean)
  async deleteWebhook(
    @Context() context: GraphqlExpressContext,
    @Args('id', { type: () => String }) id: string,
  ): Promise<boolean> {
    await this.deleteWebhookUseCase.execute({
      user: context.req.user,
      id,
    });
    return true;
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() webhook: Webhook): Promise<User | null> {
    return (await webhook.user?.load()) ?? null;
  }
}
