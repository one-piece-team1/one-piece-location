import { Controller, Get, Param, Query, SetMetadata, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../guards/local-guard';
import { CurrentUser } from '../strategy/get-user.decorator';
import { Location } from './relations';
import { LocationService } from './location.service';
import { CoordQueryDto, GetLocationById } from './dto';
import * as EUser from '../users/enums';
import * as IShare from '../interfaces';
import { ICoordQueryRange, ICoordQuerySpecifc } from './interfaces';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * @description Get Location with locationName or CountryName search
   * @routes
   * @get
   * @public
   * @param {IShare.JwtPayload} user
   * @param {IShare.ISearch} searchReq
   * @returns {Promise<IShare.IResponseBase<IShare.ILocationPagingResponseBase<Location[]> | string>>}
   */
  @Get()
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getLocationsWithNameSearch(@CurrentUser() user: IShare.JwtPayload, @Query(ValidationPipe) searchReq: IShare.ISearch): Promise<IShare.IResponseBase<IShare.ILocationPagingResponseBase<Location[]> | string>> {
    return this.locationService.getLocationsWithNameSearch(user, searchReq);
  }

  /**
   * @description Get Location with specific or range search
   * @routes
   * @get
   * @public
   * @param {IShare.JwtPayload} user
   * @param {CoordQueryDto} coordQueryDto
   * @returns {Promise<IShare.IResponseBase<IShare.ILocationCoordResponseBase<ICoordQueryRange[] | ICoordQuerySpecifc[]> | string>>}
   */
  @Get('/coordinates')
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getLocationByCoords(@CurrentUser() user: IShare.JwtPayload, @Query(ValidationPipe) coordQueryDto: CoordQueryDto): Promise<IShare.IResponseBase<IShare.ILocationCoordResponseBase<ICoordQueryRange[] | ICoordQuerySpecifc[]> | string>> {
    return this.locationService.getLocationByCoords(user, coordQueryDto);
  }

  /**
   * @description Get Location with specific or range search
   * @routes
   * @get
   * @public
   * @param {IShare.JwtPayload} user
   * @param {GetLocationById} getLocationById
   * @returns {Promise<IShare.IResponseBase<Location | string>>}
   */
  @Get('/:id')
  @SetMetadata('roles', [EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getLocationById(@CurrentUser() user: IShare.JwtPayload, @Param(ValidationPipe) getLocationById: GetLocationById): Promise<IShare.IResponseBase<Location | string>> {
    return this.locationService.getLocationById(user, getLocationById);
  }
}
