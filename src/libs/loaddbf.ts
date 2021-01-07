import { join } from 'path';
import { DBFFile } from 'dbffile';
import { createConnection } from 'typeorm';
import { config } from '../../config';
import { Logger } from '@nestjs/common';
import * as ELocation from '../locations/enums'
import * as JSONData from '../../datasets/routes/routes.json';
import { Location } from '../locations/location.entity';

interface IRoues {
  [key: string]: any;
}

class dbfHandler {
  private readonly logger: Logger = new Logger('dbfHandler');
  private readonly portFilePath: string = join(
    process.cwd(),
    'datasets/ports/WPI.dbf',
  );
  private readonly routeFilePath: string = join(
    process.cwd(),
    'datasets/routes/routes.json',
  );

  constructor() {
    this.init();
  }

  /**
   * @description Init Connection
   */
  async init() {
    await createConnection({
      type: 'postgres',
      host: config.DB_SETTINGS.host,
      port: config.DB_SETTINGS.port,
      username: config.DB_SETTINGS.username,
      password: config.DB_SETTINGS.password,
      database: config.DB_SETTINGS.database,
      entities: [Location],
      synchronize: true,
    });
  }

  /**
   * @description Read Port DBF Data and Save Data to Port Table
   */
  public async readPort() {
    const dbf = await DBFFile.open(this.portFilePath);
    const records = await dbf.readRecords();
    for (const record of records) {
      this.logger.log(JSON.stringify(record), 'ReadPort');
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
      location.srid = {
        type: 'Point',
        coordinates: [location.lon, location.lat],
      };
      location
        .save()
        .then(res =>
          this.logger.log(JSON.stringify(res), 'Create Seed location Data Success'),
        )
        .catch(err =>
          this.logger.log(err.message, 'Create Seed location Data Fail'),
        );
    }
  }
}

function bootstrap() {
  new dbfHandler().readPort();
}

bootstrap();
