import { join } from 'path';
import { DBFFile } from 'dbffile';
import { createConnection, getManager } from 'typeorm';
import { Logger } from '@nestjs/common';
import { LineString } from 'geojson';
import { config } from '../../config';
import * as ELocation from '../locations/enums';
import * as RoutesData from '../../datasets/routes/routes.json';
import * as CountriesData from '../../datasets/countries/country.json';
import { Location, Country } from '../locations/relations';
import { Turn } from '../turns/turn.entity';

interface IRoues {
  [key: string]: any;
}

interface ICountry {
  name: string;
  code: string;
  [futureKey: string]: any;
}

class DBFHandler {
  private readonly logger: Logger = new Logger('dbfHandler');
  private readonly portFilePath: string = join(process.cwd(), 'datasets/ports/WPI.dbf');

  /**
   * @description Get or create Country
   * @private
   * @param {string} code
   * @returns {Promise<Country>}
   */
  private async getCountry(code: string): Promise<Country> {
    const countriesData = CountriesData['default'] as ICountry[];
    const countryData = countriesData.filter((country) => country.code === code);
    if (countryData.length > 0) {
      const country = await getManager().findOne(Country, { where: { code } });
      if (!country) {
        const country = new Country();
        country.name = countryData[0].name;
        country.code = countryData[0].code;
        return await country.save();
      }
      return country;
    }
  }

  /**
   * @description Read Port DBF Data and Save Data to Port Table
   * @returns {Promise<void>}
   */
  public async generatePointsData(): Promise<void> {
    const dbf = await DBFFile.open(this.portFilePath);
    const records = await dbf.readRecords();
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
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
      location.country = await this.getCountry(country);
      location.point = {
        type: 'Point',
        coordinates: [location.lon, location.lat],
      };
      location.pointSrid = {
        type: 'Point',
        coordinates: [location.lon, location.lat],
      };
      this.logger.log(location, 'Debug');
      location
        .save()
        .then(() => this.logger.log('Create Seed Port Data Success'))
        .catch((err) => this.logger.log(err.message, 'Create Seed Port Data Fail'));
    }
  }

  /**
   * @description Read Sea Routes GeoJson Data and Save Data to Turn Table
   * @returns {Promise<void>}
   */
  private async generateRoutesData(): Promise<void> {
    const geoJSONData = RoutesData as IRoues;
    const geoProperties = geoJSONData.default.features;
    for (let i = 0; i < geoProperties.length; i++) {
      const lineString: LineString = geoProperties[i]['geometry'] as LineString;
      const turn = new Turn();
      const locationName: string = `${geoProperties[i]['properties'].id}` as string;
      turn.name = locationName;
      turn.geom = lineString;
      turn.srid = lineString;
      turn.length = geoProperties[i]['properties']['Length0'];
      turn.fromnode = Number(geoProperties[i]['properties']['From Node0']);
      turn.tonode = Number(geoProperties[i]['properties']['To Node0']);
      turn
        .save()
        .then(() => this.logger.log('Create Seed route point Data Success'))
        .catch((err) => this.logger.log(err.message, 'Create Seed route point Data Fail'));
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
      entities: [Location, Turn, Country],
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
