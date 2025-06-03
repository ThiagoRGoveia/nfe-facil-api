import { DownloadPath } from './download-path.vo';

describe('DownloadPath', () => {
  describe('forUser', () => {
    it('should create path with user-specific structure', () => {
      const userId = 'user-123';
      const batchId = 'batch-456';
      const path = DownloadPath.forUser(userId, batchId);

      expect(path.getBaseFolder()).toBe(`downloads/${userId}`);
      expect(path['filePrefix']).toBe(batchId);
    });

    it('should generate correct file path with extension', () => {
      const path = DownloadPath.forUser('user-123', 'batch-456');
      const result = path.forUserExtension('json');

      expect(result).toBe('downloads/user-123/batch-456.json');
    });

    it('should throw when generating extension without file prefix', () => {
      const path = DownloadPath.forPublic('public-123');
      expect(() => path.forUserExtension('json')).toThrow('User file prefix is missing');
    });
  });

  describe('forPublic', () => {
    it('should create path with public structure', () => {
      const processId = 'public-789';
      const path = DownloadPath.forPublic(processId);

      expect(path.getBaseFolder()).toBe(`downloads/results/${processId}`);
      expect(path['filePrefix']).toBeUndefined();
    });

    it('should generate correct public file path', () => {
      const path = DownloadPath.forPublic('public-789');
      const result = path.forPublicFile('report.pdf');

      expect(result).toBe('downloads/results/public-789/report.pdf');
    });
  });

  describe('getBaseFolder', () => {
    it('should return the base folder path', () => {
      const userPath = DownloadPath.forUser('user-123', 'batch-456');
      const publicPath = DownloadPath.forPublic('public-789');

      expect(userPath.getBaseFolder()).toBe('downloads/user-123');
      expect(publicPath.getBaseFolder()).toBe('downloads/results/public-789');
    });
  });
});
