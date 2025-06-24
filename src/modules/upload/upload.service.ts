import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private readonly UPLOAD_FILE_SIZE_LIMIT = 10000 * 1024 * 1024; // 10GB
  private readonly CHUNK_SIZE = 12 * 1024 * 1024; // 12
  private readonly DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;

  private sanitizePublicId(filename: string): string {
    // Remove file extension
    const withoutExtension = filename.replace(/\.[^/.]+$/, '');
    // Replace special characters, spaces, and hyphens with underscores
    return withoutExtension.replace(/[^\w]/g, '_');
  }

  private splitBuffer(buffer: Buffer, chunkSize: number): Buffer[] {
    const chunks: Buffer[] = [];
    for (let i = 0; i < buffer.length; i += chunkSize) {
      chunks.push(buffer.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async uploadToCloudinary(
    fileBuffer: Buffer,
    folderPath: string,
    options: {
      filename?: string;
      contentType?: string;
    } = {},
  ) {
    return new Promise((resolve, reject) => {
      const publicId = options.filename
        ? this.sanitizePublicId(options.filename)
        : undefined;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return reject(
              error instanceof Error
                ? error
                : new Error(
                    typeof error === 'object'
                      ? JSON.stringify(error)
                      : String(error),
                  ),
            );
          }
          resolve(result);
        },
      );

      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }
}
