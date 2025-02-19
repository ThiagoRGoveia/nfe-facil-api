import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PublicSyncProcessResponse {
  @Field(() => String, { nullable: true, description: 'Base64 encoded JSON data' })
  json?: string;

  @Field(() => String, { nullable: true, description: 'Base64 encoded CSV data' })
  csv?: string;

  @Field(() => String, { nullable: true, description: 'Base64 encoded Excel data' })
  excel?: string;

  static fromBuffers(response: { json?: Buffer; csv?: Buffer; excel?: Buffer }): PublicSyncProcessResponse {
    return {
      json: response.json?.toString('base64'),
      csv: response.csv?.toString('base64'),
      excel: response.excel?.toString('base64'),
    };
  }
}
