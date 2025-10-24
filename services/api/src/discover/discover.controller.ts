import { Controller, Get, Query } from '@nestjs/common';
import { DiscoverService } from './discover.service';

@Controller('discover')
export class DiscoverController {
  constructor(private readonly discoverService: DiscoverService) {}

  @Get()
  async getVacantUnits(
    @Query('location') location?: string,
    @Query('unitType') unitType?: string,
    @Query('maxRent') maxRent?: string,
  ) {
    const maxRentNum = maxRent ? parseInt(maxRent) : undefined;
    return this.discoverService.getVacantUnits({ location, unitType, maxRent: maxRentNum });
  }
}
