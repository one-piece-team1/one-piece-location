import { Body, Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateTurnDto, SearchForPlanStartandEndPointDto, SearchRoutePlansDto } from './dto';
import { TurnService } from './turn.service';
import * as ITurn from './interfaces';

@Controller('turns')
export class TurnController {
  constructor(private readonly turnService: TurnService) {}

  @Get('/nodes')
  getRouteStartandEndNodes(@Query(ValidationPipe) searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto) {
    return this.turnService.getRouteStartandEndNodes(searchForPlanStartandEndPointDto);
  }

  @Get('/plans')
  getRoutesPlanning(@Query(ValidationPipe) searchRoutePlansDto: SearchRoutePlansDto) {
    return this.turnService.getRoutesPlanning(searchRoutePlansDto);
  }
}
