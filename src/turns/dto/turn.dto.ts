import { IsArray, IsIn, IsNumberString, IsUUID } from 'class-validator';
import * as ELocation from '../enums';

export class CreateTurnDto {
  @IsIn([ELocation.ELocationType.TURN])
  type: ELocation.ELocationType;

  @IsArray()
  coordinates: number[];
}

export class SearchForPlanStartandEndPointDto {
  @IsUUID()
  startId: string;

  @IsUUID()
  endId: string;
}

export class SearchRoutePlansDto {
  @IsNumberString()
  startNode: number;

  @IsNumberString()
  endNode: number;

  @IsIn([ELocation.EPlanType.LINE, ELocation.EPlanType.TEXT])
  type: ELocation.EPlanType;
}
