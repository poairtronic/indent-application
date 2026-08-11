import { Injectable, Inject } from '@nestjs/common';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { IStorageAdapter, StorageStreamInfo } from '../../storage/storage.interface';

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
  constructor(@Inject('STORAGE_ADAPTER') private readonly storageAdapter: IStorageAdapter) {}

  public async saveFile(
    file: UploadedFileMetadata,
  ): Promise<{ fileName: string; fileUrl: string }> {
    const fileId = randomUUID();
    const extension = path.extname(file.originalname);
    const fileName = `${fileId}${extension}`;

    await this.storageAdapter.upload(fileName, file);

    // Return reference to download route
    const fileUrl = `/business-transactions/attachments/download/${fileName}`;
    return { fileName, fileUrl };
  }

  public async getDownloadStream(fileName: string): Promise<StorageStreamInfo> {
    return this.storageAdapter.getDownloadStream(fileName);
  }

  public async deleteFile(fileName: string): Promise<void> {
    await this.storageAdapter.delete(fileName);
  }
}
