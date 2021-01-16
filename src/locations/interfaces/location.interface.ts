import * as ELocation from '../enums';

export interface IFindByIdQuery {
  where?: {
    id?: string;
    type: ELocation.ELocationType;
  };
}

export interface ICoordQuerySpecifc {
  id: string;
  pointSrid: string;
  lat: number;
  lon: number;
  type: ELocation.ELocationType;
  locationName: string;
  country?: string;
}

export interface ICoordQueryRange extends ICoordQuerySpecifc {
  kilodistance: number;
  miledistance: number;
}
