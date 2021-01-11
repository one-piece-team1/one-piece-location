import { join } from 'path';
import { DBFFile } from 'dbffile';
import { createConnection } from 'typeorm';
import { Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { config } from '../../config';
import * as ELocation from '../locations/enums';
import * as JSONData from '../../datasets/routes/routes.json';
import { Location } from '../locations/location.entity';
import { Turn } from '../turns/turn.entity';

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
  public async generatePointsData(): Promise<void> {
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
        .then((res) => this.logger.log('Create Seed Port Data Success'))
        .catch((err) => this.logger.log(err.message, 'Create Seed Port Data Fail'));
    }

    const geoJSONData = JSONData as IRoues;
    const geoProperties = geoJSONData.default.features;
    for (let i = 0; i < geoProperties.length; i++) {
      const coordinates: number[][] = geoProperties[i]['geometry'].coordinates as number[][];
      for (let j = 0; j < coordinates.length; j++) {
        // locationName must be unique but dataset only have properties with id contains linestring each linestring must assign a id to be unique
        const locationName: string = `${geoProperties[i]['properties'].id}::${nanoid(10)}` as string;
        // for child point in linestring first elements is lontitude and second elements is latitude
        const lat: number = geoProperties[i]['geometry'].coordinates[j][1] as number;
        const lon: number = geoProperties[i]['geometry'].coordinates[j][0] as number;

        const type: ELocation.ELocationType.TURN = 'turn' as ELocation.ELocationType.TURN;
        const location = new Location();

        location.locationName = locationName;
        location.lat = lat;
        location.lon = lon;
        location.type = type;
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
          .then((res) => this.logger.log('Create Seed route linestring Data Success'))
          .catch((err) => this.logger.log(err.message, 'Create Seed route linestring Data Fail'));
      }
    }
  }

  /**
   * @description Read Sea Routes GeoJson Data and Save Data to Turn Table
   * @returns {Promise<void>}
   */
  private async generateRoutesData(): Promise<void> {
    const geoJSONData = JSONData as IRoues;
    const geoProperties = geoJSONData.default.features;
    for (let i = 0; i < geoProperties.length; i++) {
      const coordinates: number[][] = geoProperties[i]['geometry'].coordinates as number[][];
      for (let j = 0; j < coordinates.length; j++) {
        const locationName: string = `${geoProperties[i]['properties'].id}::${j}` as string;
        // for child point in linestring first elements is lontitude and second elements is latitude
        const lat: number = geoProperties[i]['geometry'].coordinates[j][1] as number;
        const lon: number = geoProperties[i]['geometry'].coordinates[j][0] as number;
        const turn = new Turn();
        turn.name = locationName;
        turn.point = {
          type: 'Point',
          coordinates: [lon, lat],
        };
        turn.srid = {
          type: 'Point',
          coordinates: [lon, lat],
        };
        turn.lat = lat;
        turn.lon = lon;
        turn.length = geoProperties[i]['properties']['Length0'];
        turn.fromnode = geoProperties[i]['properties']['From Node0'];
        turn.tonode = geoProperties[i]['properties']['To Node0'];
        turn
          .save()
          .then((res) => this.logger.log('Create Seed route point Data Success'))
          .catch((err) => this.logger.log(err.message, 'Create Seed route point Data Fail'));
      }
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

    this.generatePointsData();
    this.generateRoutesData();
  }
}

function bootstrap() {
  return new DBFHandler().generate();
}

bootstrap();
