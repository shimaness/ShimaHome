import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const p = await this.prisma.tenantProfile.findUnique({ where: { userId } });
    return p ?? null;
  }

  async upsertProfile(userId: string, data: { fullName?: string; displayName?: string; bio?: string }) {
    const existing = await this.prisma.tenantProfile.findUnique({ where: { userId } });
    if (!existing) {
      if (!data.fullName) throw new BadRequestException('fullName required for first-time profile');
      return this.prisma.tenantProfile.create({ data: { userId, fullName: data.fullName, idNumber: 'PENDING', dob: new Date('2000-01-01'), displayName: data.displayName, bio: data.bio } });
    }
    return this.prisma.tenantProfile.update({ where: { userId }, data: { fullName: data.fullName ?? existing.fullName, displayName: data.displayName, bio: data.bio } });
  }

  async patchAvatarMeta(userId: string, meta: { storageKey: string; fileName?: string; mimeType?: string; size?: number; sha256?: string }) {
    const existing = await this.prisma.tenantProfile.findUnique({ where: { userId } });
    if (!existing) throw new BadRequestException('Profile not found');
    return this.prisma.tenantProfile.update({ where: { userId }, data: {
      avatarStorageKey: meta.storageKey,
      avatarFileName: meta.fileName,
      avatarMimeType: meta.mimeType,
      avatarSize: meta.size,
      avatarSha256: meta.sha256,
    }});
  }
}
