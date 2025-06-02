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
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { FileStoragePort } from '../ports/file-storage.port';
import { Upload } from '@aws-sdk/lib-storage';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { NodeHttpHandler } from '@smithy/node-http-handler';

@Injectable()
export class S3Client implements FileStoragePort {
  private readonly s3Client: AWSS3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION_ENV');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID_ENV');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY_ENV');
    const bucketName = this.configService.get<string>('DOCUMENT_BUCKET_NAME');
    const proxyUrl = this.configService.get<string>('PROXY_URL');
    const proxyPort = this.configService.get<string>('PROXY_PORT');
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('AWS credentials are not set');
    }
    this.bucketName = bucketName;

    const clientConfig: S3ClientConfig = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    if (proxyUrl && nodeEnv !== 'local') {
      const proxyAgent = new HttpsProxyAgent(`http://${proxyUrl}:${proxyPort}`);
      clientConfig.requestHandler = new NodeHttpHandler({
        httpsAgent: proxyAgent,
        httpAgent: proxyAgent,
      });
    }

    this.s3Client = new AWSS3Client(clientConfig);
  }
  async getBuffer(path: string): Promise<Buffer> {
    const stream = await this.get(path);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async uploadFromStream(key: string, stream: Readable, contentType?: string, expiresIn?: Date): Promise<string> {
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: stream,
          ContentType: contentType,
          Expires: expiresIn,
        },
      });

      await upload.done();
      return `${this.bucketName}/${key}`;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to upload: ${error.message}`);
    }
  }

  async uploadFromBuffer(key: string, buffer: Buffer, contentType?: string, expiresIn?: Date): Promise<string> {
    const path = `${this.bucketName}/${key}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Expires: expiresIn,
    });

    try {
      await this.s3Client.send(command);
      return path;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to upload: ${error.message}`);
    }
  }

  async get(path: string): Promise<Readable> {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: path });

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
    const command = new DeleteObjectCommand({ Bucket: this.bucketName, Key: path });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete: ${error.message}`);
    }
  }

  async deleteFolder(path: string): Promise<void> {
    try {
      // List all objects in the "folder" (objects with the prefix)
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: path,
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

  async createSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({ Bucket: this.bucketName, Key: path });
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create signed URL: ${error.message}`);
    }
  }
}

export const FileStoragePortProvider = {
  provide: FileStoragePort,
  useClass: S3Client,
};
