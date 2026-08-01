import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { BusinessTransactionService } from './services/business-transaction.service';
import {
  CreateBusinessTransactionDto,
  UpdateBusinessTransactionDto,
} from './dto/create-business-transaction.dto';
import { StoresIssueDto } from './dto/stores-issue.dto';
import { ProductionUpdateDto, CustomerDeliveryDto } from './dto/production-update.dto';

@Controller('business-transactions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
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

  @Post(':id/stores-issue')
  @Permissions('stores.issue')
  async storesIssue(@Param('id') id: string, @Body() dto: StoresIssueDto, @Request() req: any) {
    return this.businessTransactionService.storesIssueMaterials(id, req.user.id, dto);
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

  @Post(':id/production-update')
  @Permissions('production.update')
  async productionUpdate(
    @Param('id') id: string,
    @Body() dto: ProductionUpdateDto,
    @Request() req: any,
  ) {
    return this.businessTransactionService.productionUpdateStatus(id, req.user.id, dto);
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
}
