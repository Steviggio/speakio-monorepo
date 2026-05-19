import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'avatars');

  constructor() {
    this.ensureUploadPath();
  }

  private async ensureUploadPath() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  // Validates file type/size, generates a UUID filename, and writes to the uploads directory.
  async saveAvatar(file: Express.Multer.File): Promise<string> {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        'Only JPG, PNG, GIF, and WebP files are allowed',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File must be under 5MB');
    }

    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(this.uploadPath, filename);

    await fs.writeFile(filePath, file.buffer);

    return `/uploads/avatars/${filename}`;
  }
}
