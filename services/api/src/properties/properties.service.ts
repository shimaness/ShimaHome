import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Property {
  id: string;
  title: string;
  type: 'bedsitter' | 'one_bedroom' | 'two_bedroom' | 'studio' | 'other';
  location: string;
  rent: number; // monthly amount in local currency
  reputation: number; // 1-5
}

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly properties: Property[] = [
    {
      id: 'p1',
      title: 'Sunny Bedsitter near CBD',
      type: 'bedsitter',
      location: 'Nairobi, Kileleshwa',
      rent: 18000,
      reputation: 4.3,
    },
    {
      id: 'p2',
      title: 'Two Bedroom with Security & Parking',
      type: 'two_bedroom',
      location: 'Nairobi, Westlands',
      rent: 65000,
      reputation: 4.7,
    },
    {
      id: 'p3',
      title: 'Studio – Close to Transit',
      type: 'studio',
      location: 'Nairobi, South B',
      rent: 25000,
      reputation: 4.1,
    },
  ];

  list(query?: { type?: Property['type']; maxRent?: number; locationContains?: string }) {
    const { type, maxRent, locationContains } = query || {};
    // Try DB first
    return this.prisma.property
      .findMany({
        where: {
          ...(type ? { type } : {}),
          ...(typeof maxRent === 'number' ? { rent: { lte: maxRent } } : {}),
          ...(locationContains ? { location: { contains: locationContains, mode: 'insensitive' } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      .catch(() => {
        // Fallback to in-memory if DB not available
        return this.properties.filter((p) => {
          if (type && p.type !== type) return false;
          if (typeof maxRent === 'number' && p.rent > maxRent) return false;
          if (locationContains && !p.location.toLowerCase().includes(locationContains.toLowerCase())) return false;
          return true;
        });
      }) as unknown as Property[];
  }

  findById(id: string) {
    return this.prisma.property
      .findUnique({ where: { id } })
      .catch(() => this.properties.find((p) => p.id === id) || null) as unknown as Property | null;
  }
}
