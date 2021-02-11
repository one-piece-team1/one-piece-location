import { LineString } from 'geojson';

export interface INetworkGeometryResponse {
  id: string;
  name: string;
  geom: string;
  srid: string;
  length?: number;
  fromnode: number;
  tonode: number;
  createdAt: string;
  updatedAt: string;
  seq: string;
  path_seq: number;
  node: string;
  edge: string;
  cost: number;
  agg_cost: number;
  route_length: number;
  l_str: string;
  lineString?: LineString;
}
