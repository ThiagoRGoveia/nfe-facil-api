export class DownloadPath {
  private readonly baseFolder: string;
  private readonly filePrefix?: string;

  private constructor(baseFolder: string, filePrefix?: string) {
    this.baseFolder = baseFolder;
    this.filePrefix = filePrefix;
  }

  // Factory for signed in users: the file key is built as downloads/{userId}/{batchProcessId}.{extension}
  static forUser(userId: string, batchProcessId: string): DownloadPath {
    return new DownloadPath(`downloads/${userId}`, batchProcessId);
  }

  // Factory for public processes: files are stored in downloads/results/{processId}/
  static forPublic(processId: string): DownloadPath {
    return new DownloadPath(`downloads/results/${processId}`);
  }

  // For user-based downloads, returns the full path for a file with the given extension
  public forUserExtension(extension: string): string {
    if (!this.filePrefix) {
      throw new Error('User file prefix is missing');
    }
    // e.g. downloads/userId/batchProcessId.json
    return `${this.baseFolder}/${this.filePrefix}.${extension}`;
  }

  // For public downloads, returns a file path by joining the base folder and a custom file name
  public forPublicFile(fileName: string): string {
    // e.g. downloads/results/processId/filename
    return `${this.baseFolder}/${fileName}`;
  }

  public getBaseFolder(): string {
    return this.baseFolder;
  }
}
