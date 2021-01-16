import { Controller, Get, Param, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ISearch } from 'interfaces';
import { CurrentUser } from 'strategy/get-user.decorator';
import { JwtPayload } from 'strategy/interfaces';
import { CoordQueryDto, GetLocationById } from './dto';
import { ResponseBase } from './interfaces';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @UseGuards(AuthGuard(['jwt']))
  getRequest(@CurrentUser() user: JwtPayload, @Query(ValidationPipe) searchReq: ISearch): Promise<ResponseBase> {
    return this.locationService.getLocationsWithNameSearch(user, searchReq);
  }

  @Get('/coordinates')
  @UseGuards(AuthGuard(['jwt']))
  getLocationByCoords(@CurrentUser() user: JwtPayload, @Query(ValidationPipe) coordQueryDto: CoordQueryDto) {
    console.log('coordQueryDto: ', coordQueryDto);
    return this.locationService.getLocationByCoords(user, coordQueryDto);
  }

  @Get('/:id')
  @UseGuards(AuthGuard(['jwt']))
  getLocationById(@CurrentUser() user: JwtPayload, @Param(ValidationPipe) getLocationById: GetLocationById): Promise<ResponseBase> {
    return this.locationService.getLocationById(user, getLocationById);
  }
}
