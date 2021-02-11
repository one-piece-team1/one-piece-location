import { Body, Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateTurnDto } from './dto';
import { TurnService } from './turn.service';
import * as ITurn from './interfaces';

@Controller('turns')
export class TurnController {
  constructor(private readonly turnService: TurnService) {}
}
