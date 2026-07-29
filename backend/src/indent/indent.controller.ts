import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { IndentService } from './indent.service';

@Controller('indents')
export class IndentController {
  constructor(private readonly indentService: IndentService) {}

  @Post()
  create(@Body() createIndentDto: any) {
    return this.indentService.create(createIndentDto);
  }

  @Get()
  findAll() {
    return this.indentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.indentService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.indentService.updateStatus(id, status);
  }
}
