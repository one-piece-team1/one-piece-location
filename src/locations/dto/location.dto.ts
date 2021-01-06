import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import * as ELocation from '../enums';

export class CreateLocationDto {
  @IsString()
  @MinLength(0)
  locationName: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lon: number;

  @IsIn([
    ELocation.ELocationType.COUNTRY,
    ELocation.ELocationType.CITY,
    ELocation.ELocationType.PORT,
    ELocation.ELocationType.SCENE,
    ELocation.ELocationType.TURN,
  ])
  type: ELocation.ELocationType;

  @IsOptional()
  country?: string;
}
