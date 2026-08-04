import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DepartmentsController } from './departments.controller';
import { ProductsController } from './products.controller';
import { MaterialsController } from './materials.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DepartmentsController, ProductsController, MaterialsController],
})
export class MasterDataModule {}
