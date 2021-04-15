import { Controller, Get, Query, SetMetadata, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../guards/local-guard';
import { TurnService } from './turn.service';
import { SearchForPlanStartandEndPointDto, SearchRoutePlansDto } from './dto';
import * as EUser from '../users/enums';
import * as IShare from '../interfaces';
import * as ITurn from './interfaces';

@Controller('turns')
export class TurnController {
  constructor(private readonly turnService: TurnService) {}

  @Get('/')
  check(): string {
    return 'turns routes is healthly';
  }

  @Get('/nodes')
  @SetMetadata('roles', [EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getADMINRouteStartandEndNodes(@Query(ValidationPipe) searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto): Promise<ITurn.INearestNodeQueryResponse> {
    return this.turnService.getRouteStartandEndNodes(searchForPlanStartandEndPointDto);
  }

  @Get('/plans')
  @SetMetadata('roles', [EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getADMINRoutesPlanning(@Query(ValidationPipe) searchRoutePlansDto: SearchRoutePlansDto): Promise<IShare.IResponseBase<ITurn.INetworkGeometryResponse[] | string>> {
    return this.turnService.getRoutesPlanning(searchRoutePlansDto);
  }

  @Get('/plans/generates')
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  generateRoutesPlanning(@Query(ValidationPipe) searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto): Promise<IShare.IResponseBase<ITurn.INetworkGeometryResponse[] | string>> {
    return this.turnService.generateRoutesPlanning(searchForPlanStartandEndPointDto);
  }
}
