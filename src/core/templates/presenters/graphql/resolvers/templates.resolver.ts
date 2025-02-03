import { Args, Mutation, Query, Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';
import { Template } from '../../../domain/entities/template.entity';
import { CreateTemplateDto } from '../../../application/dtos/create-template.dto';
import { UpdateTemplateDto } from '../../../application/dtos/update-template.dto';
import { TemplateDbPort } from '../../../application/ports/templates-db.port';
import { CreateTemplateUseCase } from '../../../application/use-cases/create-template.use-case';
import { UpdateTemplateUseCase } from '../../../application/use-cases/update-template.use-case';
import { DeleteTemplateUseCase } from '../../../application/use-cases/delete-template.use-case';
import { PaginatedResponse } from '@/infra/types/paginated-response.type';
import { PaginatedGraphqlResponse } from '@/infra/graphql/factories/paginated-response.factory';
import { Filters } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { User } from '@/core/users/domain/entities/user.entity';
import { GraphqlExpressContext } from '@/infra/graphql/types/context.type';

const PaginatedTemplates = PaginatedGraphqlResponse(Template);

@Resolver(() => Template)
export class TemplatesResolver {
  constructor(
    private readonly templateDbPort: TemplateDbPort,
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly deleteTemplateUseCase: DeleteTemplateUseCase,
  ) {}

  @Query(() => Template, { nullable: true })
  async findTemplateById(@Args('id', { type: () => Number }) id: number): Promise<Template | null> {
    return this.templateDbPort.findByIdOrFail(id);
  }

  @Query(() => PaginatedTemplates)
  async findAllTemplates(
    @Args('filters', { nullable: true }) filters?: Filters,
    @Args('pagination', { nullable: true }) pagination?: Pagination,
    @Args('sort', { nullable: true }) sort?: Sort,
  ): Promise<PaginatedResponse<Template>> {
    return this.templateDbPort.findAll(filters?.filters, pagination, sort);
  }

  @Mutation(() => Template)
  async createTemplate(
    @Context() context: GraphqlExpressContext,
    @Args('input') input: CreateTemplateDto,
  ): Promise<Template> {
    return this.createTemplateUseCase.execute({
      user: context.req.user,
      data: input,
    });
  }

  @Mutation(() => Template)
  async updateTemplate(
    @Context() context: GraphqlExpressContext,
    @Args('id', { type: () => Number }) id: number,
    @Args('input') input: UpdateTemplateDto,
  ): Promise<Template> {
    return this.updateTemplateUseCase.execute({
      user: context.req.user,
      id,
      data: input,
    });
  }

  @Mutation(() => Boolean)
  async deleteTemplate(
    @Context() context: GraphqlExpressContext,
    @Args('id', { type: () => Number }) id: number,
  ): Promise<boolean> {
    await this.deleteTemplateUseCase.execute({
      user: context.req.user,
      id,
    });
    return true;
  }

  @ResolveField(() => User, { nullable: true })
  async owner(@Parent() template: Template): Promise<User | null> {
    return template.owner?.load() ?? null;
  }
}
