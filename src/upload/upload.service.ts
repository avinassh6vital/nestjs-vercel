import { Injectable, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'public', 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async handleFileUpload(file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return {
      message: 'File uploaded successfully',
      filename: file.filename,
      url: `/uploads/${file.filename}`,
    };
  }
}
