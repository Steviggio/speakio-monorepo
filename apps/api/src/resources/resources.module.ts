import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Resource, ResourceSchema } from '../schemas/resource.schema';
import {
  ResourceImportBatch,
  ResourceImportBatchSchema,
} from '../schemas/resource-import-batch.schema';
import { ResourcesAdminController } from './resources-admin.controller';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ResourceImportService } from './services/resource-import.service';
import { ResourceRelatedService } from './services/resource-related.service';
import { ResourceCurationPipeline } from './curation/resource-curation.pipeline';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
      { name: ResourceImportBatch.name, schema: ResourceImportBatchSchema },
    ]),
  ],
  controllers: [ResourcesController, ResourcesAdminController],
  providers: [
    ResourcesService,
    ResourceImportService,
    ResourceRelatedService,
    ResourceCurationPipeline,
  ],
  exports: [ResourcesService, ResourceCurationPipeline],
})
export class ResourcesModule {}
