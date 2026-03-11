import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { UploadService } from './upload.service';

@Controller('users/me/avatar')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
        files: 1,
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Only JPEG, PNG, GIF, and WebP images are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  ) // Key matches the form-data field
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const avatarUrl = await this.uploadService.saveAvatar(file);
    const updatedUser = await this.usersService.update(req.user.userId, {
      avatarUrl,
    });

    return { avatarUrl };
  }
}
