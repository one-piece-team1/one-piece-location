import { Injectable } from '@nestjs/common';

@Injectable()
export class LocationService {
  public async getRequest(): Promise<string> {
    return 'Hello World!';
  }
}
