import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('healths')
export class HealthController {
  constructor(private readonly health: HealthCheckService, private readonly http: HttpHealthIndicator) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.http.pingCheck('location-turn', 'http://localhost:7074/turns')]);
  }
}
