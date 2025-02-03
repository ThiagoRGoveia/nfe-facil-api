import { Readable } from 'stream';

export abstract class FileStorage {
  /**
   * Uploads a file from a stream
   * @param bucket Target bucket name
   * @param key Full path/key for the file
   * @param stream Readable stream of file contents
   * @param contentType Optional MIME type of the file
   * @returns Promise resolving to the full storage path
   */
  abstract uploadFromStream(bucket: string, key: string, stream: Readable, contentType?: string): Promise<string>;

  /**
   * Retrieves a file as a readable stream
   * @param path Full storage path in format "bucket/key"
   * @returns Promise resolving to a readable stream
   */
  abstract get(path: string): Promise<Readable>;

  /**
   * Deletes a file from storage
   * @param path Full storage path in format "bucket/key"
   */
  abstract delete(path: string): Promise<void>;
}
