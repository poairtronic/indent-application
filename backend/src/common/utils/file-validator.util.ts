import * as FileType from 'file-type';
import { BadRequestException } from '@nestjs/common';

export async function validateFileSignature(buffer: Buffer, originalExt: string): Promise<void> {
  const ext = originalExt.toLowerCase();

  // Try using file-type library for binary signatures
  const fileTypeResult = await FileType.fromBuffer(buffer);

  if (fileTypeResult) {
    // PDF validation
    if (ext === '.pdf' && fileTypeResult.ext !== 'pdf') {
      throw new BadRequestException('MIME spoofing detected: File signature does not match PDF.');
    }
    // XLSX validation (Excel)
    if (ext === '.xlsx' && fileTypeResult.ext !== 'xlsx') {
      throw new BadRequestException('MIME spoofing detected: File signature does not match XLSX.');
    }
    // XLS validation (Legacy Excel - CFB format)
    if (ext === '.xls' && fileTypeResult.ext !== 'cfb') {
      throw new BadRequestException('MIME spoofing detected: File signature does not match XLS.');
    }
    // Image validation
    if ((ext === '.jpg' || ext === '.jpeg') && fileTypeResult.ext !== 'jpg') {
      throw new BadRequestException('MIME spoofing detected: File signature does not match JPG.');
    }
    if (ext === '.png' && fileTypeResult.ext !== 'png') {
      throw new BadRequestException('MIME spoofing detected: File signature does not match PNG.');
    }

    // If file-type detects an executable or dangerous type that doesn't match our allowed list
    const dangerousExts = ['exe', 'elf', 'sh', 'bat', 'cmd', 'msi', 'js', 'py', 'php', 'rb'];
    if (dangerousExts.includes(fileTypeResult.ext)) {
      throw new BadRequestException(`Dangerous file signature detected: ${fileTypeResult.ext}`);
    }

    // If fileType returns something and it passed the above checks, we consider it valid for the binary types
    if (['.pdf', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'].includes(ext)) {
      return;
    }
  }

  // Fallback for formats not natively supported by file-type v16, or text-based formats

  // DWG Magic Byte check (starts with "AC10")
  if (ext === '.dwg') {
    if (buffer.length < 4) {
      throw new BadRequestException('Invalid DWG file: file too small.');
    }
    const signature = buffer.toString('ascii', 0, 4);
    if (!signature.startsWith('AC10')) {
      throw new BadRequestException('MIME spoofing detected: File signature does not match DWG.');
    }
    return;
  }

  // DXF Text check (plain text CAD format, starts with 0/SECTION or 999 comments)
  if (ext === '.dxf') {
    if (buffer.length < 10) {
      throw new BadRequestException('Invalid DXF file: file too small.');
    }
    const snippet = buffer.toString('utf8', 0, 256).trim();
    // DXF typically starts with "0" or "999" followed by newlines.
    if (!snippet.startsWith('0') && !snippet.startsWith('999') && !snippet.includes('SECTION')) {
      throw new BadRequestException('MIME spoofing detected: File signature does not match DXF.');
    }
    return;
  }

  // If the file is a required binary type (.pdf, .xlsx, .jpg, etc.) but file-type returned undefined
  if (['.pdf', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'].includes(ext)) {
    throw new BadRequestException(
      `MIME spoofing detected: Unable to verify ${ext} file signature.`,
    );
  }
}
