import { join } from 'path';
import { DBFFile } from 'dbffile';
import { createConnection } from 'typeorm';
import { config } from '../../config';
import { Logger } from '@nestjs/common';
import * as ELocation from '../locations/enums';
import * as JSONData from '../../datasets/routes/routes.json';
import { Location } from '../locations/location.entity';
import { Turn } from '../turns/turn.entity';
// import { HaversineFactory } from './haversine';
interface IRoues {
  [key: string]: any;
}

class DBFHandler {
  private readonly logger: Logger = new Logger('dbfHandler');
  private readonly portFilePath: string = join(process.cwd(), 'datasets/ports/WPI.dbf');

  /**
   * @description Read Port DBF Data and Save Data to Port Table
   * @returns {Promise<void>}
   */
  public async generatePortData(): Promise<void> {
    const dbf = await DBFFile.open(this.portFilePath);
    const records = await dbf.readRecords();
    for (const record of records) {
      const locationName: string = record['PORT_NAME'] as string;
      const lat: number = record['LATITUDE'] as number;
      const lon: number = record['LONGITUDE'] as number;
      const type: ELocation.ELocationType.PORT = 'port' as ELocation.ELocationType.PORT;
      const country: string = record['COUNTRY'] as string;
      const location = new Location();
      location.locationName = locationName;
      location.lat = lat;
      location.lon = lon;
      location.type = type;
      location.country = country;
      location.point = {
        type: 'Point',
        coordinates: [location.lon, location.lat],
      };
      location.pointSrid = {
        type: 'Point',
        coordinates: [location.lon, location.lat],
      };
      location
        .save()
        .then((res) => this.logger.log(JSON.stringify(res), 'Create Seed Port Data Success'))
        .catch((err) => this.logger.log(err.message, 'Create Seed Port Data Fail'));
    }
  }

  /**
   * @description Read Sea Routes GeoJson Data and Save Data to Turn Table
   * @returns {Promise<void>}
   */
  public async generateRoutesData(): Promise<void> {
    const geoJSONData = JSONData as IRoues;
    const geoProperties = geoJSONData.default.features;
    for (let i = 0; i < geoProperties.length; i++) {
      console.log('geoProperties: ', geoProperties[i]['geometry']);
      const coordinates: number[][] = geoProperties[i]['geometry'].coordinates as number[][];
      const fromNode: number = geoProperties[i]['properties']['From Node0'] as number;
      const toNode: number = geoProperties[i]['properties']['To Node0'] as number;
      const length: number = geoProperties[i]['properties']['Length0'] as number;
      const turn = new Turn();
      turn.fromNode = fromNode;
      turn.toNode = toNode;
      turn.length = length;
      turn.coordinates = coordinates;
      turn.lineString = {
        type: 'LineString',
        coordinates,
      };
      turn.lineStringSrid = {
        type: 'LineString',
        coordinates,
      };
      turn
        .save()
        .then((res) => this.logger.log(JSON.stringify(res), 'Create Seed Routes Data Success'))
        .catch((err) => this.logger.log(err.message, 'Create Seed Routes Data Fail'));
    }
  }

  /**
   * @description Main Generate Func start with connecting then processing write port and turn operation
   * @returns {Promise<void>}
   */
  async generate() {
    await createConnection({
      type: 'postgres',
      host: config.DB_SETTINGS.host,
      port: config.DB_SETTINGS.port,
      username: config.DB_SETTINGS.username,
      password: config.DB_SETTINGS.password,
      database: config.DB_SETTINGS.database,
      entities: [Location, Turn],
      synchronize: true,
    }).catch((err) => this.logger.log(err.message, 'Init'));

    this.generatePortData();
    this.generateRoutesData();
  }
}

function bootstrap() {
  return new DBFHandler().generate();
}

bootstrap();
