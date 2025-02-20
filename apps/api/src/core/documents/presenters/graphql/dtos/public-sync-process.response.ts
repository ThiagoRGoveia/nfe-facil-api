import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PublicSyncProcessResponse {
  @Field(() => String, { nullable: true, description: 'Base64 encoded JSON data' })
  json?: string;

  @Field(() => String, { nullable: true, description: 'Base64 encoded CSV data' })
  csv?: string;

  @Field(() => String, { nullable: true, description: 'Base64 encoded Excel data' })
  excel?: string;

  static fromUrls(response: { json?: string; csv?: string; excel?: string }): PublicSyncProcessResponse {
    return {
      json: response.json,
      csv: response.csv,
      excel: response.excel,
    };
  }
}
