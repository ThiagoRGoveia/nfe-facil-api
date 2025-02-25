import { Readable } from 'stream';

export abstract class FileStoragePort {
  /**
   * Uploads a file from a stream
   * @param key Full path/key for the file
   * @param stream Readable stream of file contents
   * @param contentType Optional MIME type of the file
   * @returns Promise resolving to the full storage path
   */
  abstract uploadFromStream(key: string, stream: Readable, contentType?: string, expiresIn?: Date): Promise<string>;

  /**
   * Uploads a file from a buffer
   * @param key Full path/key for the file
   * @param buffer Buffer of file contents
   * @param contentType Optional MIME type of the file
   * @returns Promise resolving to the full storage path
   */
  abstract uploadFromBuffer(key: string, buffer: Buffer, contentType?: string, expiresIn?: Date): Promise<string>;

  /**
   * Retrieves a file as a readable stream
   * @param path Full storage path in format "path/to/file"
   * @returns Promise resolving to a readable stream
   */
  abstract get(path: string): Promise<Readable>;

  /**
   * Retrieves a file as a buffer
   * @param path Full storage path in format "path/to/file"
   * @returns Promise resolving to a buffer
   */
  abstract getBuffer(path: string): Promise<Buffer>;

  /**
   * Deletes a file from storage
   * @param path Full storage path in format "path/to/file"
   */
  abstract delete(path: string): Promise<void>;

  /**
   * Deletes all files in a folder from storage
   * @param path Full storage path in format "path/to/folder/"
   */
  abstract deleteFolder(path: string): Promise<void>;
}
