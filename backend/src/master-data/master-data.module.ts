import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DepartmentsController } from './departments.controller';
import { ProductsController } from './products.controller';
import { MaterialsController } from './materials.controller';

import { RedisCacheModule } from '../redis-cache/redis-cache.module';

@Module({
  imports: [PrismaModule, RedisCacheModule],
  controllers: [DepartmentsController, ProductsController, MaterialsController],
})
export class MasterDataModule {}
