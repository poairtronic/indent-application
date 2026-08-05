import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { BusinessTransactionService } from './services/business-transaction.service';
import {
  CreateBusinessTransactionDto,
  UpdateBusinessTransactionDto,
} from './dto/create-business-transaction.dto';
import { StoresIssueDto } from './dto/stores-issue.dto';
import { ProductionUpdateDto, CustomerDeliveryDto } from './dto/production-update.dto';
import { ActualCostEntryDto, FinancialClosureDto } from './dto/actual-cost-entry.dto';

@Controller('business-transactions')
export class BusinessTransactionController {
  constructor(private readonly businessTransactionService: BusinessTransactionService) {}

  @Post()
  @Permissions('indent.create')
  async create(@Body() dto: CreateBusinessTransactionDto, @Request() req: any) {
    return this.businessTransactionService.createTransaction(dto, req.user.id);
  }

  @Get()
  @Permissions('indent.view')
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('state') state?: string,
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.businessTransactionService.findAllTransactions({
      page,
      limit,
      state,
      search,
      departmentId,
    });
  }

  @Get('attachments/search')
  @Permissions('indent.view', 'accounts.verify')
  async searchAttachments(
    @Query('businessTransactionId') businessTransactionId?: string,
    @Query('costSheetId') costSheetId?: string,
    @Query('documentType') documentType?: string,
    @Query('department') department?: string,
    @Query('uploadedBy') uploadedBy?: string,
    @Query('uploadDate') uploadDate?: string,
    @Query('fileName') fileName?: string,
  ) {
    return this.businessTransactionService.searchAttachments({
      businessTransactionId,
      costSheetId,
      documentType,
      department,
      uploadedBy,
      uploadDate,
      fileName,
    });
  }

  @Get(':id')
  @Permissions('indent.view')
  async findOne(@Param('id') id: string) {
    return this.businessTransactionService.findTransactionById(id);
  }

  @Put(':id')
  @Permissions('indent.edit')
  async updateDraft(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessTransactionDto,
    @Request() req: any,
  ) {
    return this.businessTransactionService.updateDraftTransaction(id, dto, req.user.id);
  }

  @Post(':id/submit')
  @Permissions('indent.submit')
  async submitDesign(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.submitDesign(id, req.user.id, remarks);
  }

  // =========================================================================
  // LOOP 1: MANUFACTURING WORKFLOW OPERATIONS (STORES & PRODUCTION)
  // =========================================================================

  @Post(':id/stores/verify')
  @Permissions('stores.issue')
  async storesVerifyStock(@Param('id') id: string, @Request() req: any) {
    return this.businessTransactionService.storesVerifyStock(id, req.user.id);
  }

  @Post(':id/stores/issue')
  @Permissions('stores.issue')
  async storesIssueNew(@Param('id') id: string, @Body() dto: StoresIssueDto, @Request() req: any) {
    return this.businessTransactionService.storesIssueMaterials(id, req.user.id, dto);
  }

  @Post(':id/stores-issue')
  @Permissions('stores.issue')
  async storesIssue(@Param('id') id: string, @Body() dto: StoresIssueDto, @Request() req: any) {
    return this.businessTransactionService.storesIssueMaterials(id, req.user.id, dto);
  }

  @Post(':id/production/receive')
  @Permissions('production.update')
  async productionReceiveNew(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.productionReceiveMaterials(id, req.user.id, remarks);
  }

  @Post(':id/production-receive')
  @Permissions('production.update')
  async productionReceive(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.productionReceiveMaterials(id, req.user.id, remarks);
  }

  @Post(':id/production/start')
  @Permissions('production.update')
  async productionStart(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.productionStartWork(id, req.user.id, remarks);
  }

  @Patch(':id/production/progress')
  @Permissions('production.update')
  async productionProgress(
    @Param('id') id: string,
    @Body() dto: ProductionUpdateDto,
    @Request() req: any,
  ) {
    return this.businessTransactionService.productionUpdateProgress(id, req.user.id, dto);
  }

  @Post(':id/production-update')
  @Permissions('production.update')
  async productionUpdate(
    @Param('id') id: string,
    @Body() dto: ProductionUpdateDto,
    @Request() req: any,
  ) {
    return this.businessTransactionService.productionUpdateProgress(id, req.user.id, dto);
  }

  @Post(':id/production/complete')
  @Permissions('production.update')
  async productionComplete(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.productionCompleteWork(id, req.user.id, remarks);
  }

  @Post(':id/delivery')
  @Permissions('production.deliver')
  async customerDelivery(
    @Param('id') id: string,
    @Body() dto: CustomerDeliveryDto,
    @Request() req: any,
  ) {
    return this.businessTransactionService.deliverToCustomer(id, req.user.id, dto);
  }

  @Post(':id/deliver-customer')
  @Permissions('production.deliver')
  async deliverCustomer(
    @Param('id') id: string,
    @Body() dto: CustomerDeliveryDto,
    @Request() req: any,
  ) {
    return this.businessTransactionService.deliverToCustomer(id, req.user.id, dto);
  }

  // =========================================================================
  // LOOP 2: FINANCIAL WORKFLOW & ARCHIVAL ENDPOINTS
  // =========================================================================

  @Post(':id/accounts/verify')
  @Permissions('accounts.verify')
  async accountsVerifyNew(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.startAccountsVerification(id, req.user.id, remarks);
  }

  @Post(':id/accounts-verify')
  @Permissions('accounts.verify')
  async startAccountsVerify(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.startAccountsVerification(id, req.user.id, remarks);
  }

  @Post(':id/accounts/actual-cost')
  @Permissions('accounts.verify')
  async enterActualCostsNew(
    @Param('id') id: string,
    @Body() dto: ActualCostEntryDto,
    @Request() req: any,
  ) {
    return this.businessTransactionService.enterActualCosts(id, req.user.id, dto);
  }

  @Post(':id/actual-costs')
  @Permissions('accounts.verify')
  async enterActualCosts(
    @Param('id') id: string,
    @Body() dto: ActualCostEntryDto,
    @Request() req: any,
  ) {
    return this.businessTransactionService.enterActualCosts(id, req.user.id, dto);
  }

  @Patch(':id/accounts/material-cost')
  @Permissions('accounts.verify')
  async updateMaterialCost(
    @Param('id') id: string,
    @Body()
    dto: { costItemId: string; actualRate: number; actualQuantity: number; remarks?: string },
    @Request() req: any,
  ) {
    return this.businessTransactionService.updateMaterialActualCosts(id, req.user.id, dto);
  }

  @Post(':id/accounts/financial-close')
  @Permissions('accounts.close')
  async financialCloseNew(
    @Param('id') id: string,
    @Body() dto: FinancialClosureDto,
    @Request() req: any,
  ) {
    return this.businessTransactionService.financialClosure(id, req.user.id, dto);
  }

  @Post(':id/financial-closure')
  @Permissions('accounts.close')
  async financialClosure(
    @Param('id') id: string,
    @Body() dto: FinancialClosureDto,
    @Request() req: any,
  ) {
    return this.businessTransactionService.financialClosure(id, req.user.id, dto);
  }

  @Post(':id/archive')
  @Permissions('system.archive')
  async archiveTransaction(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.archiveTransaction(id, req.user.id, remarks);
  }

  @Post(':id/complete')
  @Permissions('system.complete')
  async completeTransaction(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.completeTransaction(id, req.user.id, remarks);
  }

  // =========================================================================
  // ATTACHMENT & DOCUMENT OPERATIONS (DESIGN & ACCOUNTS DEPARTMENTS)
  // =========================================================================

  @Post(':id/attachments')
  @Permissions('indent.edit', 'accounts.verify')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.uploadAttachmentToIndent(id, file, req.user.id, remarks);
  }

  @Get('attachments/download/:fileName')
  async downloadAttachment(
    @Param('fileName') fileName: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const filePath = await this.businessTransactionService.getAttachmentFilePath(fileName);
    await this.businessTransactionService.logDocumentDownload(fileName, req.user.id);
    return res.sendFile(filePath);
  }

  @Get(':id/attachments/summary')
  @Permissions('indent.view', 'accounts.verify')
  async getAttachmentSummary(@Param('id') id: string) {
    return this.businessTransactionService.getAttachmentSummary(id);
  }

  @Get(':id/attachments/:attachmentId/history')
  @Permissions('indent.view', 'accounts.verify')
  async getAttachmentHistory(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.businessTransactionService.getAttachmentHistory(id, attachmentId);
  }

  @Put(':id/attachments/:attachmentId')
  @Permissions('indent.edit', 'accounts.verify')
  @UseInterceptors(FileInterceptor('file'))
  async replaceAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @UploadedFile() file: any,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.replaceAttachment(
      id,
      attachmentId,
      file,
      req.user.id,
      remarks,
    );
  }

  @Delete(':id/attachments/:attachmentId')
  @Permissions('indent.edit', 'accounts.verify')
  async removeAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Request() req: any,
  ) {
    return this.businessTransactionService.deleteAttachment(id, attachmentId, req.user.id);
  }
}
