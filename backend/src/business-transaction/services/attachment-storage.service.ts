import { Injectable, Inject, Logger, ServiceUnavailableException } from '@nestjs/common';
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

/**
 * PRF-EXT-001 / ERR-L2-011: Configurable storage timeouts.
 * Prevents external storage I/O from blocking HTTP workers indefinitely.
 */
const STORAGE_UPLOAD_TIMEOUT_MS = parseInt(process.env.STORAGE_UPLOAD_TIMEOUT_MS || '30000', 10);
const STORAGE_DELETE_TIMEOUT_MS = parseInt(process.env.STORAGE_DELETE_TIMEOUT_MS || '10000', 10);
const STORAGE_DOWNLOAD_TIMEOUT_MS = parseInt(
  process.env.STORAGE_DOWNLOAD_TIMEOUT_MS || '20000',
  10,
);

/**
 * Wraps a storage operation in a timeout guard.
 * If the operation exceeds the timeout, throws ServiceUnavailableException.
 * This prevents external storage I/O from blocking HTTP workers indefinitely (PRF-EXT-001).
 */
async function withStorageTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new ServiceUnavailableException(
          `Storage operation '${operationName}' timed out after ${timeoutMs}ms. External storage may be unavailable.`,
        ),
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operation, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

@Injectable()
export class AttachmentStorageService {
  private readonly logger = new Logger(AttachmentStorageService.name);

  constructor(@Inject('STORAGE_ADAPTER') private readonly storageAdapter: IStorageAdapter) {}

  /**
   * Upload file to storage with configurable timeout (PRF-EXT-001).
   * Returns the generated fileName and relative fileUrl.
   */
  public async saveFile(
    file: UploadedFileMetadata,
  ): Promise<{ fileName: string; fileUrl: string }> {
    const fileId = randomUUID();
    const extension = path.extname(file.originalname);
    const fileName = `${fileId}${extension}`;

    await withStorageTimeout(
      this.storageAdapter.upload(fileName, file),
      STORAGE_UPLOAD_TIMEOUT_MS,
      `upload:${fileName}`,
    );

    // Return reference to download route
    const fileUrl = `/business-transactions/attachments/download/${fileName}`;
    return { fileName, fileUrl };
  }

  public async getDownloadStream(fileName: string): Promise<StorageStreamInfo> {
    return withStorageTimeout(
      this.storageAdapter.getDownloadStream(fileName),
      STORAGE_DOWNLOAD_TIMEOUT_MS,
      `download:${fileName}`,
    );
  }

  /**
   * ERR-L2-003: Attempt physical file deletion with timeout guard.
   * Returns true if the file was deleted, false if not found or if deletion failed.
   * The caller decides whether a deletion failure is fatal (replace path) or
   * acceptable degradation (soft-delete path where the record is already marked isDeleted).
   */
  public async deleteFile(fileName: string): Promise<boolean> {
    try {
      await withStorageTimeout(
        this.storageAdapter.delete(fileName),
        STORAGE_DELETE_TIMEOUT_MS,
        `delete:${fileName}`,
      );
      this.logger.log(`Storage file deleted successfully: ${fileName}`);
      return true;
    } catch (err: any) {
      // Log but do not re-throw — callers are responsible for deciding
      // how to handle partial failure (e.g., log for reconciliation).
      this.logger.error(
        `Storage deletion failed for '${fileName}': ${err.message}. ` +
          `File may be orphaned. Manual reconciliation may be required.`,
      );
      return false;
    }
  }

  /**
   * Check file existence in storage (used for reconciliation).
   */
  public async fileExists(fileName: string): Promise<boolean> {
    try {
      return await withStorageTimeout(
        this.storageAdapter.exists(fileName),
        STORAGE_DELETE_TIMEOUT_MS,
        `exists:${fileName}`,
      );
    } catch {
      return false;
    }
  }
}
