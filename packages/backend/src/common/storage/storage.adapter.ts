export const STORAGE_ADAPTER = 'STORAGE_ADAPTER';

export interface StorageAdapter {
  save(file: Buffer, filename: string, mimetype: string): Promise<string>;
  delete(url: string): Promise<void>;
}
