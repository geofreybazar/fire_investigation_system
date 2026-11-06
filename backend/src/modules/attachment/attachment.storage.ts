import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const KEY_FORMAT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Files on the server's disk, outside the web root (UPLOAD_DIR, default
// ./uploads under the backend's working directory). Files are named by a
// random key only, so nothing from the client ends up in a path. Another
// store (e.g. S3) can replace this class later.
@Injectable()
export class AttachmentStorage {
  private readonly root: string;

  constructor(configService: ConfigService) {
    this.root = resolve(
      configService.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads'),
    );
  }

  async save(content: Buffer): Promise<string> {
    const key = randomUUID();

    await mkdir(this.root, { recursive: true });
    // 'wx' never overwrites an existing file.
    await writeFile(this.path(key), content, { flag: 'wx' });

    return key;
  }

  open(key: string) {
    return createReadStream(this.path(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.path(key), { force: true });
  }

  private path(key: string): string {
    if (!KEY_FORMAT.test(key)) {
      throw new Error('Invalid storage key');
    }

    return join(this.root, key);
  }
}
