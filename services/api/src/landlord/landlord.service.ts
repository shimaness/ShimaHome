import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LandlordService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.landlordProfile.findUnique({ where: { userId } });
  }

  async upsertProfile(userId: string, input: { fullName: string; phone: string; idNumber: string; residenceArea: string }) {
    if (!input.fullName || !input.phone || !input.idNumber || !input.residenceArea) throw new BadRequestException('Missing fields');
    const existing = await this.prisma.landlordProfile.findUnique({ where: { userId } });
    if (existing) {
      return this.prisma.landlordProfile.update({ where: { userId }, data: { fullName: input.fullName, phone: input.phone, idNumber: input.idNumber, residenceArea: input.residenceArea } });
    }
    return this.prisma.landlordProfile.create({ data: { userId, fullName: input.fullName, phone: input.phone, idNumber: input.idNumber, residenceArea: input.residenceArea } });
  }

  async requestVerification(userId: string, type: 'PHONE'|'EMAIL') {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.verificationCode.create({ data: { userId, type, code, expiresAt: expires } });
    return { sent: true, via: type, expiresAt: expires };
  }

  async confirmVerification(userId: string, type: 'PHONE'|'EMAIL', code: string) {
    const now = new Date();
    const rec = await this.prisma.verificationCode.findFirst({ where: { userId, type, consumedAt: null, expiresAt: { gt: now } }, orderBy: { createdAt: 'desc' } });
    if (!rec || rec.code !== code) throw new BadRequestException('Invalid or expired code');
    await this.prisma.verificationCode.update({ where: { id: rec.id }, data: { consumedAt: new Date() } });
    if (type === 'PHONE') await this.prisma.landlordProfile.updateMany({ where: { userId }, data: { phoneVerified: true } });
    if (type === 'EMAIL') await this.prisma.landlordProfile.updateMany({ where: { userId }, data: { emailVerified: true } });
    return { verified: true };
  }

  async createSubmission(userId: string, input: { name: string; description?: string; address?: string; latitude?: number; longitude?: number }) {
    if (!input.name) throw new BadRequestException('Name required');
    return this.prisma.propertySubmission.create({ data: { userId, name: input.name, description: input.description, address: input.address, latitude: input.latitude ?? null, longitude: input.longitude ?? null } });
  }

  async listSubmissions(userId: string) {
    return this.prisma.propertySubmission.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async submitForReview(userId: string, submissionId: string) {
    const sub = await this.prisma.propertySubmission.findUnique({ where: { id: submissionId } });
    if (!sub || sub.userId !== userId) throw new NotFoundException('Submission not found');
    return this.prisma.propertySubmission.update({ where: { id: submissionId }, data: { status: 'UNDER_REVIEW' } });
  }
}
