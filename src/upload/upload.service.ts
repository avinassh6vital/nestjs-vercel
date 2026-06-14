import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'public', 'uploads');

  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async handleFileUpload(file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const uploadRecord = this.uploadRepository.create({
      filename: file.filename,
      originalname: file.originalname,
      url: `/uploads/${file.filename}`,
    });

    const saved = await this.uploadRepository.save(uploadRecord);

    return {
      message: 'File uploaded successfully',
      id: saved.id,
      filename: saved.filename,
      originalname: saved.originalname,
      url: saved.url,
      createdAt: saved.createdAt,
    };
  }
}
