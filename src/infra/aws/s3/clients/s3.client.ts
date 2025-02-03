import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client as AWSS3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { FileStorage } from '../ports/file-storage.port';

@Injectable()
export class S3Client implements FileStorage {
  private readonly s3Client: AWSS3Client;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are not set');
    }

    const clientConfig = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    this.s3Client = new AWSS3Client(clientConfig);
  }

  private parsePath(path: string): { bucket: string; key: string } {
    const [bucket, ...keyParts] = path.split('/');
    const key = keyParts.join('/');
    return { bucket, key };
  }

  async uploadFromStream(bucket: string, key: string, stream: Readable, contentType?: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: stream,
      ContentType: contentType,
    });

    try {
      await this.s3Client.send(command);
      return `${bucket}/${key}`;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to upload: ${error.message}`);
    }
  }

  async get(path: string): Promise<Readable> {
    const { bucket, key } = this.parsePath(path);
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });

    try {
      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (error) {
      if (error.$metadata?.httpStatusCode === 404) {
        throw new NotFoundException('Resource not found');
      }
      throw new InternalServerErrorException(`Failed to retrieve: ${error.message}`);
    }
  }

  async delete(path: string): Promise<void> {
    const { bucket, key } = this.parsePath(path);
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete: ${error.message}`);
    }
  }
}
