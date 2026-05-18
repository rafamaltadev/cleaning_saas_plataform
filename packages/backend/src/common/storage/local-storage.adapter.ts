import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StorageAdapter } from './storage.adapter';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(file: Buffer, filename: string, _mimetype: string): Promise<string> {
    const filepath = path.join(this.uploadDir, filename);
    await fs.promises.writeFile(filepath, file);
    return `/uploads/${filename}`;
  }

  async delete(url: string): Promise<void> {
    const filename = path.basename(url);
    const filepath = path.join(this.uploadDir, filename);
    try {
      await fs.promises.unlink(filepath);
    } catch {
      // file may not exist — ignore
    }
  }
}
