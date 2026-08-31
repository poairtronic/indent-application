import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IStorageAdapter, StorageStreamInfo } from '../storage.interface';
import { UploadedFileMetadata } from '../../business-transaction/services/attachment-storage.service';

@Injectable()
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'attachments');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(fileName: string, file: UploadedFileMetadata): Promise<void> {
    const filePath = path.join(this.uploadDir, fileName);
    await fs.promises.writeFile(filePath, file.buffer);
  }

  async getDownloadStream(fileName: string): Promise<StorageStreamInfo> {
    const filePath = path.normalize(path.join(this.uploadDir, fileName));
    const normalizedUploadDir = path.normalize(this.uploadDir);

    if (!filePath.startsWith(normalizedUploadDir)) {
      throw new NotFoundException(`Invalid filename: '${fileName}'. Path traversal detected.`);
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File '${fileName}' not found in local storage.`);
    }

    const stat = await fs.promises.stat(filePath);
    const stream = fs.createReadStream(filePath);

    // Guess content type based on extension
    let contentType = 'application/octet-stream';
    const ext = path.extname(fileName).toLowerCase();
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.xlsx' || ext === '.xls')
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.dwg' || ext === '.dxf') contentType = 'application/acad';

    return {
      stream,
      contentType,
      contentLength: stat.size,
    };
  }

  async delete(fileName: string): Promise<void> {
    const filePath = path.normalize(path.join(this.uploadDir, fileName));
    if (!filePath.startsWith(path.normalize(this.uploadDir))) {
      return; // Do nothing if path traversal is attempted
    }
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async exists(fileName: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, fileName);
    return fs.existsSync(filePath);
  }
}
