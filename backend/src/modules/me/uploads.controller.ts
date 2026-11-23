import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { AppError } from '../../common/errors/app-error';
import { UPLOAD_DIR, UPLOAD_ROUTE } from '../../common/http/uploads';

const MAX_BYTES = 5 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type UploadedImage = { buffer: Buffer; size: number };

/** Nhận diện ảnh theo vài byte đầu, không tin phần mở rộng hay mimetype trình duyệt gửi. */
export const imageExtension = (buffer: Buffer): 'jpg' | 'png' | null => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return 'png';
  return null;
};

/** UC05 Tải ảnh đại diện: multipart field `file`, chỉ JPEG/PNG (INVALID_FILE). FE gửi tiếp PATCH /me với avatarUrl. */
@Controller('uploads')
export class UploadsController {
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async avatar(@UploadedFile() file: UploadedImage | undefined) {
    const ext = file ? imageExtension(file.buffer) : null;
    if (!file || !ext) throw new AppError('INVALID_FILE');

    const name = `${randomUUID()}.${ext}`;
    await mkdir(join(UPLOAD_DIR, 'avatars'), { recursive: true });
    await writeFile(join(UPLOAD_DIR, 'avatars', name), file.buffer);
    return { avatarUrl: `${UPLOAD_ROUTE}/avatars/${name}` };
  }
}
