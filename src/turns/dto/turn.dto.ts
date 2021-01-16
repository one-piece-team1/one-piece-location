import { IsArray, IsIn } from 'class-validator';
import * as ELocation from '../enums';

export class CreateTurnDto {
  @IsIn([ELocation.ELocationType.TURN])
  type: ELocation.ELocationType;

  @IsArray()
  coordinates: number[];
}
