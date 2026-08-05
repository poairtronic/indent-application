import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { IndentService } from './indent.service';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('indents')
export class IndentController {
  constructor(private readonly indentService: IndentService) {}

  @Post()
  @Permissions('indent.create')
  create(@Body() createIndentDto: any) {
    return this.indentService.create(createIndentDto);
  }

  @Get()
  @Permissions('indent.view')
  findAll() {
    return this.indentService.findAll();
  }

  @Get(':id')
  @Permissions('indent.view')
  findOne(@Param('id') id: string) {
    return this.indentService.findOne(id);
  }

  @Patch(':id/status')
  @Permissions('indent.edit')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.indentService.updateStatus(id, status);
  }
}
