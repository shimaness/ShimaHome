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

  // New Property Management Methods
  async createProperty(userId: string, input: { name: string; description?: string; location: string; address?: string; latitude?: number; longitude?: number }) {
    // Get landlord profile
    const profile = await this.prisma.landlordProfile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('Landlord profile not found');

    return this.prisma.propertyListing.create({
      data: {
        landlordId: profile.id,
        name: input.name,
        description: input.description,
        location: input.location,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        status: 'UNDER_REVIEW', // Admin needs to approve
      },
    });
  }

  async createUnit(userId: string, propertyId: string, input: { name: string; unitType: string; rent: number; deposit?: number; description?: string }) {
    // Verify ownership
    const property = await this.prisma.propertyListing.findUnique({
      where: { id: propertyId },
      include: { landlord: true },
    });

    if (!property || property.landlord.userId !== userId) {
      throw new NotFoundException('Property not found or unauthorized');
    }

    return this.prisma.propertyUnit.create({
      data: {
        propertyId,
        name: input.name,
        unitType: input.unitType as any,
        rent: input.rent,
        deposit: input.deposit,
        description: input.description,
        occupancyStatus: 'VACANT', // Default to vacant
      },
    });
  }

  async createUnitPhoto(userId: string, unitId: string, input: { storageKey: string; photoTag: string; fileName?: string; mimeType?: string; size?: number }) {
    // Verify ownership of unit
    const unit = await this.prisma.propertyUnit.findUnique({
      where: { id: unitId },
      include: { property: { include: { landlord: true } } },
    });

    if (!unit || unit.property.landlord.userId !== userId) {
      throw new NotFoundException('Unit not found or unauthorized');
    }

    // Count existing photos to set order
    const photoCount = await this.prisma.unitPhoto.count({ where: { unitId } });

    return this.prisma.unitPhoto.create({
      data: {
        unitId,
        storageKey: input.storageKey,
        photoTag: input.photoTag as any,
        fileName: input.fileName,
        mimeType: input.mimeType,
        size: input.size,
        order: photoCount,
      },
    });
  }

  async updateUnitOccupancy(userId: string, unitId: string, occupancyStatus: string) {
    // Verify ownership
    const unit = await this.prisma.propertyUnit.findUnique({
      where: { id: unitId },
      include: { property: { include: { landlord: true } } },
    });

    if (!unit || unit.property.landlord.userId !== userId) {
      throw new NotFoundException('Unit not found or unauthorized');
    }

    return this.prisma.propertyUnit.update({
      where: { id: unitId },
      data: { occupancyStatus: occupancyStatus as any },
    });
  }
}
