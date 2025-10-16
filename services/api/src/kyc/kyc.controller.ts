import { BadRequestException, Body, Controller, Get, Headers, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';

@Controller('kyc')
export class KycController {
  constructor(private readonly kyc: KycService, private readonly jwt: JwtService) {}

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
    return this.kyc.getProfile(uid);
  }

  @Post('profile')
  async upsertProfile(@Headers('authorization') auth: string | undefined, @Body() body: { fullName: string; idNumber: string; dob: string }) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    return this.kyc.upsertProfile(uid, body);
  }

  @Get('docs')
  async listDocs(@Headers('authorization') auth?: string) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    return this.kyc.listDocs(uid);
  }

  @Post('docs')
  async addDoc(
    @Headers('authorization') auth: string | undefined,
    @Body() body: { kind: 'NATIONAL_ID'|'PASSPORT'|'UTILITY_BILL'|'SELFIE'|'OWNERSHIP_DOC'; storageKey: string; note?: string }
  ) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    return this.kyc.addDoc(uid, body);
  }

  @Post('docs/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadDoc(
    @Headers('authorization') auth: string | undefined,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { kind?: 'NATIONAL_ID'|'PASSPORT'|'UTILITY_BILL'|'SELFIE'|'OWNERSHIP_DOC'; note?: string }
  ) {
    const uid = await this.getUserIdFromAuth(auth);
    if (!uid) return { error: 'Unauthorized' };
    if (!file) throw new BadRequestException('File is required');
    const allowed = ['image/jpeg','image/png','image/webp','application/pdf'];
    if (!allowed.includes(file.mimetype)) throw new BadRequestException('Unsupported file type');
    // Multer already enforces size; double-check
    const maxSize = 5 * 1024 * 1024; if (file.size > maxSize) throw new BadRequestException('File too large');

    // Basic AV test (EICAR); for production, integrate ClamAV/ICAP
    const ascii = file.buffer.toString('latin1');
    if (ascii.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
      throw new BadRequestException('Malicious content detected');
    }

    // Strip EXIF and normalize images
    let processed = file.buffer;
    if (file.mimetype.startsWith('image/')) {
      const img = sharp(file.buffer).rotate(); // auto-orient
      if (file.mimetype === 'image/jpeg') processed = await img.jpeg({ quality: 90 }).toBuffer();
      else if (file.mimetype === 'image/png') processed = await img.png({ compressionLevel: 9 }).toBuffer();
      else if (file.mimetype === 'image/webp') processed = await img.webp({ quality: 90 }).toBuffer();
    }

    const hash = crypto.createHash('sha256').update(processed).digest('hex');
    const ext = file.originalname.includes('.') ? file.originalname.substring(file.originalname.lastIndexOf('.')) : '';
    const dir = path.join(process.cwd(), 'uploads', 'kyc', uid);
    fs.mkdirSync(dir, { recursive: true });
    const fname = `${Date.now()}-${hash.slice(0,12)}${ext}`;
    const fullPath = path.join(dir, fname);
    fs.writeFileSync(fullPath, processed);

    const storageKey = `uploads/kyc/${uid}/${fname}`;
    const kind = body.kind ?? 'NATIONAL_ID';
    const created = await this.kyc.addDoc(uid, {
      kind,
      storageKey,
      note: body.note,
    });
    // patch metadata
    await this.kyc['prisma'].kycDocument.update({
      where: { id: created.id },
      data: { fileName: file.originalname, mimeType: file.mimetype, size: processed.length, sha256: hash },
    });
    return created;
  }

  // Admin endpoints
  private async isAdmin(authHeader?: string): Promise<{ userId: string } | null> {
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length);
    const payload = await this.jwt.verifyAsync<{ sub: string; role?: string }>(token).catch(() => null);
    if (payload?.role !== 'ADMIN') return null;
    return { userId: payload.sub };
  }

  @Get('admin/docs/pending')
  async listPending(@Headers('authorization') auth?: string) {
    const admin = await this.isAdmin(auth);
    if (!admin) return { error: 'Forbidden' };
    return this.kyc.listPendingDocs();
  }

  @Post('admin/docs/approve')
  async approve(@Headers('authorization') auth: string | undefined, @Body() body: { id: string }) {
    const admin = await this.isAdmin(auth);
    if (!admin) return { error: 'Forbidden' };
    return this.kyc.reviewDoc(body.id, admin.userId, 'APPROVE');
  }

  @Post('admin/docs/reject')
  async reject(@Headers('authorization') auth: string | undefined, @Body() body: { id: string }) {
    const admin = await this.isAdmin(auth);
    if (!admin) return { error: 'Forbidden' };
    return this.kyc.reviewDoc(body.id, admin.userId, 'REJECT');
  }
}
