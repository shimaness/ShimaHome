import { Controller, Get, Param, Query } from '@nestjs/common';
import { PropertiesService, Property } from './properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  list(
    @Query('type') type?: Property['type'],
    @Query('maxRent') maxRent?: string,
    @Query('location') locationContains?: string,
  ) {
    const rent = maxRent ? Number(maxRent) : undefined;
    return this.properties.list({ type, maxRent: rent, locationContains });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const found = this.properties.findById(id);
    if (!found) return { error: 'Not found' };
    return found;
  }
}
