import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @UsePipes(ValidationPipe)
  getRequest(): Promise<string> {
    return this.locationService.getRequest();
  }
}
