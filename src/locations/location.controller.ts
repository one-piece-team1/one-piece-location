import { Body, Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ISearch } from 'interfaces';
import { CurrentUser } from 'strategy/get-user.decorator';
import { JwtPayload } from 'strategy/interfaces';
import { GetLocationById } from './dto';
import { ResponseBase } from './interfaces';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @UseGuards(AuthGuard(['jwt']))
  getRequest(@CurrentUser() user: JwtPayload, @Query() searchReq: ISearch): Promise<ResponseBase> {
    return this.locationService.getLocationsWithNameSearch(user, searchReq);
  }

  @Get('/:id')
  @UseGuards(AuthGuard(['jwt']))
  getLocationById(@CurrentUser() user: JwtPayload, @Param(ValidationPipe) getLocationById: GetLocationById): Promise<ResponseBase> {
    return this.locationService.getLocationById(user, getLocationById);
  }
}
