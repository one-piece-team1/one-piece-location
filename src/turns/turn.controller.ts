import { Body, Controller, Get, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateTurnDto } from './dto';
import { TurnService } from './turn.service';
import * as ITurn from './interfaces';

@Controller('turns')
export class TurnController {
  constructor(private readonly turnService: TurnService) {}

  @Get()
  @UsePipes(ValidationPipe)
  getRequest(@Body() createTurnDto: CreateTurnDto): Promise<ITurn.ResponseBase> {
    return this.turnService.postTrun(createTurnDto);
  }
}
