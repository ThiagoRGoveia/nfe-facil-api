import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client as AWSS3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  _Object,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { FileStoragePort } from '../ports/file-storage.port';

@Injectable()
export class S3Client implements FileStoragePort {
  private readonly s3Client: AWSS3Client;
  private readonly bucketName: string;
  private readonly bufferCache = new Map<string, Buffer>();

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('DOCUMENT_BUCKET_NAME');
    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('AWS credentials are not set');
    }
    this.bucketName = bucketName;

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

  async uploadFromStream(key: string, stream: Readable, contentType?: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: stream,
      ContentType: contentType,
    });

    try {
      await this.s3Client.send(command);
      return `${this.bucketName}/${key}`;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to upload: ${error.message}`);
    }
  }

  async uploadFromBuffer(key: string, buffer: Buffer, contentType?: string): Promise<string> {
    const path = `${this.bucketName}/${key}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    try {
      await this.s3Client.send(command);
      this.bufferCache.set(path, buffer);
      return path;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to upload: ${error.message}`);
    }
  }

  async get(path: string): Promise<Readable> {
    const cachedBuffer = this.bufferCache.get(path);
    if (cachedBuffer) {
      const stream = new Readable();
      stream.push(cachedBuffer);
      stream.push(null);
      return stream;
    }

    const { bucket, key } = this.parsePath(path);
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });

    try {
      const response = await this.s3Client.send(command);
      if (!response.Body) {
        throw new NotFoundException('Resource not found');
      }
      // NOTICE: AWS SDK returns a ReadableStream, but does not type the response.Body correctly, hence the cast
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
      this.bufferCache.delete(path);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete: ${error.message}`);
    }
  }

  async deleteFolder(path: string): Promise<void> {
    const { bucket, key: prefix } = this.parsePath(path);

    try {
      // List all objects in the "folder" (objects with the prefix)
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      });

      let isTruncated = true;
      let contents: _Object[] = [];

      while (isTruncated) {
        const { Contents, IsTruncated, NextContinuationToken } = await this.s3Client.send(listCommand);
        contents = Contents || [];
        isTruncated = IsTruncated || false;

        // Delete in batches of 1000 (S3 limit)
        if (contents.length > 0) {
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
              Objects: contents.map(({ Key }) => ({ Key })),
              Quiet: true,
            },
          });
          await this.s3Client.send(deleteCommand);
        }

        if (isTruncated) {
          listCommand.input.ContinuationToken = NextContinuationToken;
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete folder: ${error.message}`);
    }
  }
}
