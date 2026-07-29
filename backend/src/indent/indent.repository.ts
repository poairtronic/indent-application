import { Injectable } from '@nestjs/common';

@Injectable()
export class IndentRepository {
  private indents: any[] = [];

  async create(indent: any) {
    const newIndent = {
      id: Math.random().toString(36).substring(7),
      ...indent,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.indents.push(newIndent);
    return newIndent;
  }

  async findAll() {
    return this.indents;
  }

  async findOne(id: string) {
    return this.indents.find((indent) => indent.id === id);
  }

  async updateStatus(id: string, status: string) {
    const indent = await this.findOne(id);
    if (indent) {
      indent.status = status;
      indent.updatedAt = new Date();
    }
    return indent;
  }
}
