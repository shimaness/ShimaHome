import { BadRequestException, Body, Controller, Get, Headers, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';
import { Response } from 'express';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenants: TenantService, private readonly jwt: JwtService) {}

  private async getUserIdFromAuth(authHeader?: string): Promise<string | null> {
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length);
    const payload = await this.jwt.verifyAsync<{ sub: string }>(token).catch(() => null);
    return payload?.sub ?? null;
  }

  @Get('profile')
  async getProfile(@Headers('authorization') auth?: string) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    return this.tenants.getProfile(uid);
  }

  @Post('profile')
  async upsertProfile(
    @Headers('authorization') auth: string | undefined,
    @Body() body: { fullName?: string; displayName?: string; bio?: string }
  ) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    return this.tenants.upsertProfile(uid, body);
  }

  @Post('avatar/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 3 * 1024 * 1024 } }))
  async uploadAvatar(
    @Headers('authorization') auth: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    if (!file) throw new BadRequestException('File is required');
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.mimetype)) throw new BadRequestException('Unsupported file type');
    const maxSize = 3 * 1024 * 1024; if (file.size > maxSize) throw new BadRequestException('File too large');

    let processed = file.buffer;
    if (file.mimetype.startsWith('image/')) {
      processed = await sharp(file.buffer).rotate().resize(512, 512, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
    }

    const hash = crypto.createHash('sha256').update(processed).digest('hex');
    const dir = path.join(process.cwd(), 'uploads', 'avatars', uid);
    fs.mkdirSync(dir, { recursive: true });
    const fname = `${Date.now()}-${hash.slice(0,12)}.jpg`;
    const fullPath = path.join(dir, fname);
    fs.writeFileSync(fullPath, processed);

    const storageKey = `uploads/avatars/${uid}/${fname}`;
    await this.tenants.patchAvatarMeta(uid, {
      storageKey,
      fileName: file.originalname,
      mimeType: 'image/jpeg',
      size: processed.length,
      sha256: hash,
    });
    return { ok: true, storageKey };
  }

  @Get('avatar')
  async getAvatar(@Headers('authorization') auth: string | undefined, @Res() res: Response) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const profile = await this.tenants.getProfile(uid);
    if (!profile?.avatarStorageKey) return res.status(404).json({ error: 'No avatar' });
    const full = path.join(process.cwd(), profile.avatarStorageKey);
    if (!fs.existsSync(full)) return res.status(404).json({ error: 'No avatar' });
    res.setHeader('Content-Type', profile.avatarMimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=600');
    fs.createReadStream(full).pipe(res);
  }
}
