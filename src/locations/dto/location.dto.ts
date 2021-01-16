import { IsIn, IsNumber, IsNumberString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import * as ELocation from '../enums';

export class CreateLocationDto {
  @IsString()
  @MinLength(0)
  locationName: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lon: number;

  @IsIn([ELocation.ELocationType.COUNTRY, ELocation.ELocationType.CITY, ELocation.ELocationType.PORT, ELocation.ELocationType.SCENE, ELocation.ELocationType.TURN])
  type: ELocation.ELocationType;

  @IsOptional()
  countryName?: string;

  @IsOptional()
  countryCode?: string;
}

export class GetLocationById {
  @IsUUID()
  id: string;
}

export class PageQueryDto {
  @IsOptional()
  take?: number;

  @IsOptional()
  skip?: number;
}

export class CoordQueryDto extends PageQueryDto {
  @IsNumberString()
  lat: number;

  @IsNumberString()
  lon: number;

  @IsIn([ELocation.ELocationCoordQueryMethod.SPECIFIC, ELocation.ELocationCoordQueryMethod.RANGE])
  method: ELocation.ELocationCoordQueryMethod;

  @IsOptional()
  range?: number;
}
