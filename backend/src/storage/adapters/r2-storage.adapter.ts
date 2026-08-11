import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { IStorageAdapter, StorageStreamInfo } from '../storage.interface';
import { UploadedFileMetadata } from '../../business-transaction/services/attachment-storage.service';
import { Readable } from 'stream';

@Injectable()
export class R2StorageAdapter implements IStorageAdapter {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(R2StorageAdapter.name);

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || '';
    const endpoint =
      process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');

    if (!accessKeyId || !secretAccessKey || !this.bucketName || !endpoint) {
      this.logger.error(
        'R2 Storage configuration is missing. Ensure R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_ENDPOINT/R2_ACCOUNT_ID are set.',
      );
      if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: Missing Cloudflare R2 configuration in production.');
      }
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: accessKeyId || 'placeholder',
        secretAccessKey: secretAccessKey || 'placeholder',
      },
    });
  }

  async upload(fileName: string, file: UploadedFileMetadata): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await this.s3Client.send(command);
    } catch (err: any) {
      this.logger.error(`Failed to upload file '${fileName}' to R2: ${err.message}`);
      throw new InternalServerErrorException('Failed to store attachment permanently.');
    }
  }

  async getDownloadStream(fileName: string): Promise<StorageStreamInfo> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('Response body is empty');
      }

      return {
        stream: response.Body as Readable,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength || 0,
      };
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        throw new NotFoundException(`File '${fileName}' not found in permanent storage.`);
      }
      this.logger.error(`Failed to retrieve file '${fileName}' from R2: ${err.message}`);
      throw new InternalServerErrorException('Failed to retrieve attachment.');
    }
  }

  async delete(fileName: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });
      await this.s3Client.send(command);
    } catch (err: any) {
      this.logger.error(`Failed to delete file '${fileName}' from R2: ${err.message}`);
      // Not throwing error to allow graceful degradation (DB delete proceeds even if R2 delete fails).
    }
  }

  async exists(fileName: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });
      await this.s3Client.send(command);
      return true;
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      this.logger.warn(`Failed to check existence of '${fileName}': ${err.message}`);
      return false;
    }
  }
}
