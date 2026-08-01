import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface UploadedFileMetadata {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class AttachmentStorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'attachments');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public async saveFile(
    file: UploadedFileMetadata,
  ): Promise<{ fileName: string; fileUrl: string }> {
    const fileId = randomUUID();
    const extension = path.extname(file.originalname);
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, file.buffer);

    // Return reference to download route
    const fileUrl = `/business-transactions/attachments/download/${fileName}`;
    return { fileName, fileUrl };
  }

  public async getFilePath(fileName: string): Promise<string> {
    const filePath = path.join(this.uploadDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File '${fileName}' not found in storage.`);
    }
    return filePath;
  }

  public async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}
