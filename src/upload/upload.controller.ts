import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Get,
  Param,
  ParseUUIDPipe,
  Res,
  HttpStatus,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UploadService } from './upload.service';
import { AuthGuard } from '../auth/auth.guard';
import * as express from 'express';
import * as fs from 'fs';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Only images (.jpg, .jpeg, .png) and PDFs (.pdf) are allowed'),
            false,
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadFile(@UploadedFile() file: any) {
    return this.uploadService.handleFileUpload(file);
  }

  @Get(':id')
  async getFile(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: string,
    @Res() res: express.Response,
  ) {
    try {
      const upload = await this.uploadService.findOne(id);
      if (!upload) {
        throw new NotFoundException(`Upload record with ID ${id} not found`);
      }

      const filePath = join(process.cwd(), 'public', 'uploads', upload.filename);
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException(`Physical file for upload ${id} not found on disk`);
      }

      return res.sendFile(filePath);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve file',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

