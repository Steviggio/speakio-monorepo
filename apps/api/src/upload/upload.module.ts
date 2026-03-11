import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule], // Need users service to update the user record
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
