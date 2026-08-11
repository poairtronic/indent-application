import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageAdapter, StorageStreamInfo } from '../storage.interface';
import { UploadedFileMetadata } from '../../business-transaction/services/attachment-storage.service';
import { Readable } from 'stream';

@Injectable()
export class SupabaseStorageAdapter implements IStorageAdapter {
  private readonly supabase: SupabaseClient;
  private readonly bucketName: string;
  private readonly logger = new Logger(SupabaseStorageAdapter.name);

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'imcms-attachments';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      this.logger.error(
        'Supabase Storage configuration is missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.',
      );
      if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: Missing Supabase Storage configuration in production.');
      }
    }

    this.supabase = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseServiceRoleKey || 'placeholder',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  async upload(fileName: string, file: UploadedFileMetadata): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      this.logger.error(`Failed to upload file '${fileName}' to Supabase: ${err.message}`);
      throw new InternalServerErrorException('Failed to store attachment permanently.');
    }
  }

  async getDownloadStream(fileName: string): Promise<StorageStreamInfo> {
    try {
      const { data, error } = await this.supabase.storage.from(this.bucketName).download(fileName);

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Response body is empty');
      }

      // data is a Web Blob. We can convert it to ArrayBuffer and stream it.
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        stream: Readable.from(buffer),
        contentType: data.type || 'application/octet-stream',
        contentLength: data.size || 0,
      };
    } catch (err: any) {
      // Handle "Object not found" gracefully
      if (
        err.error === 'Object not found' ||
        err.statusCode === 404 ||
        err.message?.includes('not found')
      ) {
        throw new NotFoundException(`File '${fileName}' not found in permanent storage.`);
      }
      this.logger.error(`Failed to retrieve file '${fileName}' from Supabase: ${err.message}`);
      throw new InternalServerErrorException('Failed to retrieve attachment.');
    }
  }

  async delete(fileName: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage.from(this.bucketName).remove([fileName]);

      if (error) {
        throw error;
      }
    } catch (err: any) {
      this.logger.error(`Failed to delete file '${fileName}' from Supabase: ${err.message}`);
      // Not throwing error to allow graceful degradation (DB delete proceeds even if storage delete fails).
    }
  }

  async exists(fileName: string): Promise<boolean> {
    try {
      // Supabase does not have a generic 'head' object, we list or try to get info.
      // Easiest is to check if it's in the bucket directory, or download it with small byte range if supported.
      // Alternatively, we can use createSignedUrl which fails if it doesn't exist depending on policies.
      // Let's use `createSignedUrl` as a proxy to check existence or just attempt a download.
      // Since `download` fetches the whole file, it's safer to use `list`.

      // Since it's stored flat currently, we can list files with the prefix of fileName
      // but if the filename is long or nested, we can search by path.

      // Workaround: We can't trivially do a HEAD request via supabase-js without custom fetch,
      // so we use list.
      const directory = fileName.includes('/')
        ? fileName.substring(0, fileName.lastIndexOf('/'))
        : '';
      const baseName = fileName.includes('/')
        ? fileName.substring(fileName.lastIndexOf('/') + 1)
        : fileName;

      const { data, error } = await this.supabase.storage.from(this.bucketName).list(directory, {
        search: baseName,
        limit: 1,
      });

      if (error || !data || data.length === 0) {
        return false;
      }

      return data.some((file) => file.name === baseName);
    } catch (err: any) {
      this.logger.warn(`Failed to check existence of '${fileName}': ${err.message}`);
      return false;
    }
  }
}
