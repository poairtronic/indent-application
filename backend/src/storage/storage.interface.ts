import { Readable } from 'stream';
import { UploadedFileMetadata } from '../business-transaction/services/attachment-storage.service';

export interface StorageStreamInfo {
  stream: NodeJS.ReadableStream | Readable;
  contentType: string;
  contentLength: number;
}

export interface IStorageAdapter {
  upload(fileName: string, file: UploadedFileMetadata): Promise<void>;
  getDownloadStream(fileName: string): Promise<StorageStreamInfo>;
  delete(fileName: string): Promise<void>;
  exists(fileName: string): Promise<boolean>;
}
