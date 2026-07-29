import { Injectable } from '@nestjs/common';
import { IndentRepository } from './indent.repository';

@Injectable()
export class IndentService {
  constructor(private readonly indentRepository: IndentRepository) {}

  async create(createIndentDto: any) {
    return this.indentRepository.create(createIndentDto);
  }

  async findAll() {
    return this.indentRepository.findAll();
  }

  async findOne(id: string) {
    return this.indentRepository.findOne(id);
  }

  async updateStatus(id: string, status: string) {
    return this.indentRepository.updateStatus(id, status);
  }
}
