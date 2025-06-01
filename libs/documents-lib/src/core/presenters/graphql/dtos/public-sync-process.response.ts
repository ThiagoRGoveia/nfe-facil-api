import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PublicSyncProcessError {
  @Field(() => String, { nullable: false, description: 'File name' })
  fileName: string;

  @Field(() => String, { nullable: true, description: 'Error message' })
  error?: string;
}
@ObjectType()
export class PublicSyncProcessResponse {
  @Field(() => String, { nullable: true, description: 'Base64 encoded JSON data' })
  json?: string;

  @Field(() => String, { nullable: true, description: 'Base64 encoded CSV data' })
  csv?: string;

  @Field(() => String, { nullable: true, description: 'Base64 encoded Excel data' })
  excel?: string;

  @Field(() => [PublicSyncProcessError], { nullable: true, description: 'Errors' })
  errors?: PublicSyncProcessError[];

  static fromUrls(response: {
    json?: string;
    csv?: string;
    excel?: string;
    errors?: PublicSyncProcessError[];
  }): PublicSyncProcessResponse {
    return {
      json: response.json,
      csv: response.csv,
      excel: response.excel,
      errors: response.errors,
    };
  }
}
