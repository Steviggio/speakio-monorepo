import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Roadmap, RoadmapSchema } from '../schemas/roadmap.schema';
import { RoadmapsService } from './roadmaps.service';
import { RoadmapsController } from './roadmaps.controller';
import { AnkiCsvExportAdapter } from './adapters/anki-csv-export.adapter';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Roadmap.name, schema: RoadmapSchema }]),
  ],
  controllers: [RoadmapsController],
  providers: [RoadmapsService, AnkiCsvExportAdapter],
  exports: [RoadmapsService, AnkiCsvExportAdapter],
})
export class RoadmapsModule {}
