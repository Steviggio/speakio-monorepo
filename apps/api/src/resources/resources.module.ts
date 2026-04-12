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
import { ResourceInferenceService } from './services/resource-inference.service';
import { ResourceNormalizerService } from './services/resource-normalizer.service';
import { ResourceRelatedService } from './services/resource-related.service';
import { ResourceContentNormalizationService } from './services/resource-content-normalization.service';
import { ResourceClassificationService } from './services/resource-classification.service';
import { ResourceQualityService } from './services/resource-quality.service';

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
    ResourceNormalizerService,
    ResourceInferenceService,
    ResourceImportService,
    ResourceRelatedService,
    ResourceContentNormalizationService,
    ResourceClassificationService,
    ResourceQualityService,
  ],
  exports: [ResourcesService],
})
export class ResourcesModule {}
