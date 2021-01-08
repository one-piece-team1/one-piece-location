import { Controller, Get, Param, ParseUUIDPipe, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'strategy/get-user.decorator';
import { JwtPayload } from 'strategy/interfaces';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @UseGuards(AuthGuard(['jwt']))
  getRequest(
    @CurrentUser() user: JwtPayload,
  ): Promise<string> {
    console.log('user', user)
    return this.locationService.getRequest();
  }
}
