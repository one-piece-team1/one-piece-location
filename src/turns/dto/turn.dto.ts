import { IsArray, IsIn, IsNumberString } from 'class-validator';
import * as ELocation from '../enums';

export class CreateTurnDto {
  @IsIn([ELocation.ELocationType.TURN])
  type: ELocation.ELocationType;

  @IsNumberString()
  fromNode: number;

  @IsNumberString()
  toNode: number;

  @IsArray()
  coordinates: number[][];
}

export class GetRoutePlanningDto {
  @IsNumberString()
  endNode: number;
}
