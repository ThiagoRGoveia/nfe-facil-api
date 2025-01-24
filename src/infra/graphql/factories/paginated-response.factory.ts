import { Field, ObjectType } from '@nestjs/graphql';

type ClassConstructor<T> = new (...args: any[]) => T;

export function PaginatedGraphqlResponse<T>(classConstructor: ClassConstructor<T>) {
  @ObjectType(`Paginated${classConstructor.name}Response`)
  class PaginatedResponseClass {
    @Field(() => [classConstructor])
    items: T[];

    @Field(() => Number)
    total: number;

    @Field(() => Number)
    page: number;

    @Field(() => Number)
    pageSize: number;

    @Field(() => Number)
    totalPages: number;
  }

  return PaginatedResponseClass;
}
