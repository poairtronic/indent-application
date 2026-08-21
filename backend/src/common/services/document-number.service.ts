import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const COMPANY_CODE = 'AGIPL';

export enum DocumentType {
  INDENT = 'INDENT',
  COST_SHEET = 'COST_SHEET',
  MATERIAL = 'MATERIAL',
  PRODUCT = 'PRODUCT',
}

export interface DocumentNumberOptions {
  companyCode?: string;
  year?: number;
  minDigits?: number;
}

@Injectable()
export class DocumentNumberService {
  private readonly logger = new Logger(DocumentNumberService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Format sequential integer with zero-padding (minimum 3 digits)
   * 1 -> 001, 10 -> 010, 999 -> 999, 1000 -> 1000
   */
  public formatSequenceNumber(seq: number, minDigits = 3): string {
    return seq.toString().padStart(minDigits, '0');
  }

  /**
   * Atomically reserve the next sequence number in PostgreSQL.
   * Safe under high concurrency using atomic UPSERT / UPDATE ... RETURNING.
   */
  public async getNextSequence(
    documentType: DocumentType | string,
    year = 0,
    prismaClient: any = this.prisma,
  ): Promise<number> {
    const client = prismaClient || this.prisma;

    // Use atomic PostgreSQL query for 100% race-condition safe sequence reservation
    const result: Array<{ reservedNumber: number | bigint }> = await client.$queryRaw`
      INSERT INTO "document_sequences" ("id", "documentType", "year", "nextNumber", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${documentType}, ${year}, 2, NOW(), NOW())
      ON CONFLICT ("documentType", "year")
      DO UPDATE SET 
        "nextNumber" = "document_sequences"."nextNumber" + 1,
        "updatedAt" = NOW()
      RETURNING ("document_sequences"."nextNumber" - 1)::integer AS "reservedNumber"
    `;

    if (result && result.length > 0) {
      return Number(result[0].reservedNumber);
    }

    throw new Error(`Failed to allocate sequential document number for ${documentType} (${year})`);
  }

  /**
   * Generate next Indent Number: AGIPL-IND-YYYY-001 (Resets annually)
   */
  public async generateIndentNumber(
    prismaClient?: any,
    options?: DocumentNumberOptions,
  ): Promise<string> {
    const company = options?.companyCode || COMPANY_CODE;
    const year = options?.year || new Date().getFullYear();
    const minDigits = options?.minDigits || 3;

    const seq = await this.getNextSequence(DocumentType.INDENT, year, prismaClient);
    const formattedSeq = this.formatSequenceNumber(seq, minDigits);
    const documentNumber = `${company}-IND-${year}-${formattedSeq}`;

    this.logger.log(`Allocated Indent Document Number: ${documentNumber}`);
    return documentNumber;
  }

  /**
   * Generate next Cost Sheet Number: AGIPL-CS-YYYY-001 (Resets annually, independent of Indent)
   */
  public async generateCostSheetNumber(
    prismaClient?: any,
    options?: DocumentNumberOptions,
  ): Promise<string> {
    const company = options?.companyCode || COMPANY_CODE;
    const year = options?.year || new Date().getFullYear();
    const minDigits = options?.minDigits || 3;

    const seq = await this.getNextSequence(DocumentType.COST_SHEET, year, prismaClient);
    const formattedSeq = this.formatSequenceNumber(seq, minDigits);
    const documentNumber = `${company}-CS-${year}-${formattedSeq}`;

    this.logger.log(`Allocated Cost Sheet Document Number: ${documentNumber}`);
    return documentNumber;
  }

  /**
   * Generate next Material Number: AGIPL-MAT-001 (Global sequence, never resets)
   */
  public async generateMaterialNumber(
    prismaClient?: any,
    options?: DocumentNumberOptions,
  ): Promise<string> {
    const company = options?.companyCode || COMPANY_CODE;
    const minDigits = options?.minDigits || 3;

    const seq = await this.getNextSequence(DocumentType.MATERIAL, 0, prismaClient);
    const formattedSeq = this.formatSequenceNumber(seq, minDigits);
    const documentNumber = `${company}-MAT-${formattedSeq}`;

    this.logger.log(`Allocated Material Document Number: ${documentNumber}`);
    return documentNumber;
  }

  /**
   * Generate next Product Number: AGIPL-PRD-001 (Global sequence, never resets)
   */
  public async generateProductNumber(
    prismaClient?: any,
    options?: DocumentNumberOptions,
  ): Promise<string> {
    const company = options?.companyCode || COMPANY_CODE;
    const minDigits = options?.minDigits || 3;

    const seq = await this.getNextSequence(DocumentType.PRODUCT, 0, prismaClient);
    const formattedSeq = this.formatSequenceNumber(seq, minDigits);
    const documentNumber = `${company}-PRD-${formattedSeq}`;

    this.logger.log(`Allocated Product Document Number: ${documentNumber}`);
    return documentNumber;
  }
}
