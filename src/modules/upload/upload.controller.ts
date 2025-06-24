/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Controller,
  Post,
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded.');
    }

    const uploadResults: any[] = [];
    let folderPath = 'skill-proof/';
    if (req.body.path) {
      folderPath = req.body.path;
    }

    for (const file of files) {
      const result: any = await this.uploadService.uploadToCloudinary(
        file.buffer,
        folderPath,
        {
          filename: file.originalname,
          contentType: file.mimetype,
        },
      );
      uploadResults.push(result.url);
    }

    return uploadResults;
  }
}
