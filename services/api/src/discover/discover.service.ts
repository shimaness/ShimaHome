import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscoverService {
  constructor(private readonly prisma: PrismaService) {}

  async getVacantUnits(filters?: { location?: string; unitType?: string; maxRent?: number }) {
    const where: any = {
      occupancyStatus: 'VACANT',
      property: {
        status: 'ACTIVE', // Only show active properties
      },
    };

    // Apply filters
    if (filters?.unitType) {
      where.unitType = filters.unitType;
    }

    if (filters?.maxRent) {
      where.rent = { lte: filters.maxRent };
    }

    if (filters?.location) {
      where.property = {
        ...where.property,
        location: {
          contains: filters.location,
          mode: 'insensitive',
        },
      };
    }

    // Fetch units with property and photo information
    const units = await this.prisma.propertyUnit.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            location: true,
            address: true,
          },
        },
        photos: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            storageKey: true,
            photoTag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Newest first, could be randomized later
      },
      take: 100, // Limit for performance
    });

    return units;
  }
}
