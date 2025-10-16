import { BadRequestException, Body, Controller, Get, Headers, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LandlordService } from './landlord.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';

@Controller('landlord')
export class LandlordController {
  constructor(private readonly svc: LandlordService, private readonly jwt: JwtService) {}

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
    return this.svc.getProfile(uid);
  }

  @Post('profile')
  async upsertProfile(
    @Headers('authorization') auth: string | undefined,
    @Body() body: { fullName: string; phone: string; idNumber: string; residenceArea: string }
  ) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    return this.svc.upsertProfile(uid, body);
  }

  @Post('verify/request')
  async requestVerify(@Headers('authorization') auth: string | undefined, @Body() body: { type: 'PHONE' | 'EMAIL' }) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    if (!body?.type) throw new BadRequestException('Missing type');
    return this.svc.requestVerification(uid, body.type);
  }

  @Post('verify/confirm')
  async confirmVerify(
    @Headers('authorization') auth: string | undefined,
    @Body() body: { type: 'PHONE' | 'EMAIL'; code: string }
  ) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    if (!body?.type || !body?.code) throw new BadRequestException('Missing fields');
    return this.svc.confirmVerification(uid, body.type, body.code);
  }

  @Get('submissions')
  async listSubs(@Headers('authorization') auth?: string) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    return this.svc.listSubmissions(uid);
  }

  @Post('submissions')
  async createSub(
    @Headers('authorization') auth: string | undefined,
    @Body() body: { name: string; description?: string; address?: string; latitude?: number; longitude?: number }
  ) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    return this.svc.createSubmission(uid, body);
  }

  @Post('submissions/:id/submit')
  async submitForReview(
    @Headers('authorization') auth: string | undefined,
    @Param('id') id: string
  ) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    return this.svc.submitForReview(uid, id);
  }

  @Post('photos/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadPhoto(
    @Headers('authorization') auth: string | undefined,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { submissionId: string }
  ) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    if (!file) throw new BadRequestException('File is required');
    if (!body?.submissionId) throw new BadRequestException('Missing submissionId');
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.mimetype)) throw new BadRequestException('Unsupported file type');

    // EXIF strip + normalize
    let processed = file.buffer;
    const img = sharp(file.buffer).rotate();
    if (file.mimetype === 'image/jpeg') processed = await img.jpeg({ quality: 90 }).toBuffer();
    else if (file.mimetype === 'image/png') processed = await img.png({ compressionLevel: 9 }).toBuffer();
    else if (file.mimetype === 'image/webp') processed = await img.webp({ quality: 90 }).toBuffer();

    const hash = crypto.createHash('sha256').update(processed).digest('hex');
    const ext = file.originalname.includes('.') ? file.originalname.substring(file.originalname.lastIndexOf('.')) : '';
    const dir = path.join(process.cwd(), 'uploads', 'submissions', body.submissionId);
    fs.mkdirSync(dir, { recursive: true });
    const fname = `${Date.now()}-${hash.slice(0,12)}${ext}`;
    fs.writeFileSync(path.join(dir, fname), processed);

    const rec = await (this as any).svc['prisma'].propertyPhoto.create({
      data: {
        submissionId: body.submissionId,
        storageKey: `uploads/submissions/${body.submissionId}/${fname}`,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: processed.length,
        sha256: hash,
      },
    });
    return rec;
  }
}
