import { Logger } from '@nestjs/common';
import { createConnection, getManager } from 'typeorm';
import { LineString } from 'geojson';
import * as CountriesData from '../../datasets/countries/country.json';
import { Country, Location } from '../locations/relations';
import { Turn } from '../turns/turn.entity';
import { testOrmconfig } from '../config/orm.config';
import * as ELocation from '../locations/enums';

const mockTurn = [
  {
    properties: {
      'From Node0': 3555.0,
      'Route Freq': 26748.0,
      Impedence0: 89.4,
      id: 'a625nghvhpzn',
      'To Node0': 4771.0,
      Name0: '',
      Length0: 1.532,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-6.583310127, 49.74998856],
        [-5.5, 48.66669083],
      ],
    },
  },
  {
    properties: {
      'From Node0': 3386.0,
      'Route Freq': 18.0,
      Impedence0: 412.6,
      id: 'a625ngaszwrp',
      'To Node0': 2945.0,
      Name0: '',
      Length0: 9.291,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-20.0, 49.99998093],
        [-10.80000019, 51.29999924],
      ],
    },
  },
  {
    properties: {
      'From Node0': 3385.0,
      'Route Freq': 20.0,
      Impedence0: 443.8,
      id: 'a625ng7n55hf',
      'To Node0': 3384.0,
      Name0: '',
      Length0: 10.0,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-30.00000954, 49.99998093],
        [-40.0, 49.99998093],
      ],
    },
  },
  {
    properties: {
      'From Node0': 3384.0,
      'Route Freq': 20.0,
      Impedence0: 443.8,
      id: 'a625ng7e43mk',
      'To Node0': 3385.0,
      Name0: '',
      Length0: 10.0,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-40.0, 49.99998093],
        [-30.00000954, 49.99998093],
      ],
    },
  },
  {
    properties: {
      'From Node0': 11985.0,
      'Route Freq': 10701277.0,
      Impedence0: 78.5,
      id: 'a625ng7eswo0',
      'To Node0': 14985.0,
      Name0: '',
      Length0: 1.476,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-52.70000076, 46.79999924],
        [-54.0, 46.0999794],
      ],
    },
  },
  {
    properties: {
      'From Node0': 11985.0,
      'Route Freq': 6684673.0,
      Impedence0: 62.9,
      id: 'a625nggqrlqx',
      'To Node0': 7177.0,
      Name0: '',
      Length0: 0.922,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-52.70000076, 46.79999924],
        [-52.5, 47.69998932],
      ],
    },
  },
  {
    properties: {
      'From Node0': 14985.0,
      'Route Freq': 2.0,
      Impedence0: 78.5,
      id: 'a625ng6o6yvx',
      'To Node0': 11985.0,
      Name0: '',
      Length0: 1.476,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-54.0, 46.0999794],
        [-52.70000076, 46.79999924],
      ],
    },
  },
  {
    properties: {
      'From Node0': 6982.0,
      'Route Freq': 3.0,
      Impedence0: 121.7,
      id: 'a625ngkiwytz',
      'To Node0': 14984.0,
      Name0: '',
      Length0: 1.88,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-60.20000076, 47.74998093],
        [-59.29999161, 46.0999794],
      ],
    },
  },
  {
    properties: {
      'From Node0': 3380.0,
      'Route Freq': 3947988.0,
      Impedence0: 26.5,
      id: 'a625ngj9jzo7',
      'To Node0': 3533.0,
      Name0: '',
      Length0: 0.542,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-66.00000763, 49.99998093],
        [-65.50036621, 49.7902298],
      ],
    },
  },
  {
    properties: {
      'From Node0': 3533.0,
      'Route Freq': 548230.0,
      Impedence0: 549.6,
      id: 'a625nghtytmt',
      'To Node0': 20369.0,
      Name0: 'St LAWRE',
      Length0: 10.476,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-65.50036621, 49.7902298],
        [-68.72971344, 48.70270157],
        [-70.81226349, 46.8309288],
        [-74.67067719, 45.00577927],
      ],
    },
  },
  {
    properties: {
      'From Node0': 20369.0,
      'Route Freq': 36109.0,
      Impedence0: 37.55,
      id: 'a625ng8ivman',
      'To Node0': 22188.0,
      Name0: 'St LAWRE',
      Length0: 0.69,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-74.67067719, 45.00577927],
        [-75.33110809, 44.80496979],
      ],
    },
  },
  {
    properties: {
      'From Node0': 22188.0,
      'Route Freq': 6492.0,
      Impedence0: 10.56,
      id: 'a625nge6b01e',
      'To Node0': 22879.0,
      Name0: 'St LAWRE',
      Length0: 0.186,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-75.33110809, 44.80496979],
        [-75.4908371, 44.70988846],
      ],
    },
  },
  {
    properties: {
      'From Node0': 22879.0,
      'Route Freq': 13217.0,
      Impedence0: 44.85,
      id: 'a625ng5myncx',
      'To Node0': 26044.0,
      Name0: 'St LAWRE',
      Length0: 0.757,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-75.4908371, 44.70988846],
        [-76.09010315, 44.24663925],
      ],
    },
  },
  {
    properties: {
      'From Node0': 26044.0,
      'Route Freq': 3055.0,
      Impedence0: 9.16,
      id: 'a625ngbndvkp',
      'To Node0': 26349.0,
      Name0: 'St LAWRE',
      Length0: 0.175,
    },
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-76.09010315, 44.24663925],
        [-76.25750732, 44.19398117],
      ],
    },
  },
];

const mockLocation = [
  {
    PORT_NAME: 'MILLHAVEN',
    LATITUDE: 44.2,
    LONGITUDE: -76.733333,
    COUNTRY: 'CA',
  },
  {
    PORT_NAME: "ST. MARY'S (SCILLY ISL.)",
    LATITUDE: 49.916667,
    LONGITUDE: -6.316667,
    COUNTRY: 'GB',
  },
];

interface ICountry {
  name: string;
  code: string;
  [futureKey: string]: any;
}

class MockHandler {
  private readonly logger: Logger = new Logger('dbfHandler');

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
      const country = await getManager('testConnection').findOne(Country, { where: { code } });
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
    for (let i = 0; i < mockLocation.length; i++) {
      const record = mockLocation[i];
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
      try {
        await location.save();
        this.logger.log('Create Seed Port Data Success');
      } catch (error) {
        this.logger.log(error.message, 'Create Seed Port Data Fail');
      }
    }
  }

  /**
   * @description Read Sea Routes GeoJson Data and Save Data to Turn Table
   * @returns {Promise<void>}
   */
  private async generateRoutesData(): Promise<void> {
    for (let i = 0; i < mockTurn.length; i++) {
      const lineString: LineString = mockTurn[i]['geometry'] as LineString;
      const turn = new Turn();
      const locationName: string = `${mockTurn[i]['properties'].id}` as string;
      turn.name = locationName;
      turn.geom = lineString;
      turn.srid = lineString;
      turn.length = mockTurn[i]['properties']['Length0'];
      turn.fromnode = Number(mockTurn[i]['properties']['From Node0']);
      turn.tonode = Number(mockTurn[i]['properties']['To Node0']);
      try {
        await turn.save();
        this.logger.log('Create Seed route point Data Success');
      } catch (error) {
        this.logger.log(error.message, 'Create Seed route point Data Fail');
      }
    }
  }

  /**
   * @description Main Generate Func start with connecting then processing write port and turn operation
   * @returns {Promise<void>}
   */
  public async generate() {
    await this.generatePointsData();
    await this.generateRoutesData();
  }
}

export async function boostrap() {
  return new MockHandler().generate();
}
