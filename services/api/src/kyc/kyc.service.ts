import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.tenantProfile.findUnique({ where: { userId } });
    return profile ?? null;
  }

  async upsertProfile(userId: string, input: { fullName: string; idNumber: string; dob: string }) {
    if (!input.fullName || !input.idNumber || !input.dob) throw new BadRequestException('Missing fields');
    const dob = new Date(input.dob);
    if (Number.isNaN(dob.getTime())) throw new BadRequestException('Invalid date');
    const existing = await this.prisma.tenantProfile.findUnique({ where: { userId } });
    if (existing) {
      return this.prisma.tenantProfile.update({
        where: { userId },
        data: { fullName: input.fullName, idNumber: input.idNumber, dob },
      });
    }
    return this.prisma.tenantProfile.create({ data: { userId, fullName: input.fullName, idNumber: input.idNumber, dob } });
  }

  async listDocs(userId: string) {
    return this.prisma.kycDocument.findMany({ where: { userId }, orderBy: { uploadedAt: 'desc' } });
  }

  async addDoc(userId: string, input: { kind: 'NATIONAL_ID'|'PASSPORT'|'UTILITY_BILL'|'SELFIE'|'OWNERSHIP_DOC'; storageKey: string; note?: string }) {
    if (!input.kind || !input.storageKey) throw new BadRequestException('Missing fields');
    return this.prisma.kycDocument.create({ data: { userId, kind: input.kind, storageKey: input.storageKey, note: input.note } });
  }

  // Admin
  async listPendingDocs() {
    return this.prisma.kycDocument.findMany({ where: { status: 'PENDING' }, orderBy: { uploadedAt: 'asc' } });
  }

  async reviewDoc(docId: string, reviewerId: string, action: 'APPROVE' | 'REJECT') {
    const doc = await this.prisma.kycDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const updated = await this.prisma.kycDocument.update({
      where: { id: docId },
      data: { status, reviewerId, reviewedAt: new Date() },
    });
    // If approving identity docs, optionally update TenantProfile status to APPROVED if at least one approved doc exists
    if (status === 'APPROVED') {
      const approvedCount = await this.prisma.kycDocument.count({ where: { userId: doc.userId, status: 'APPROVED' } });
      if (approvedCount > 0) {
        await this.prisma.tenantProfile.updateMany({ where: { userId: doc.userId }, data: { status: 'APPROVED' } });
      }
    }
    return updated;
  }
}
