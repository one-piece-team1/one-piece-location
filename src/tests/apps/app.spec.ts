import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { config } from '../../../config';

describe('# App', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(config.PORT);
  });

  describe('# Health Check', () => {
    it('Should be able to return with success health status', (done) => {
      return request(app.getHttpServer())
        .get('/healths')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          status: 'ok',
          info: {
            'location-turn': {
              status: 'up',
            },
          },
          error: {},
          details: {
            'location-turn': {
              status: 'up',
            },
          },
        })
        .then(() => done())
        .catch((err) => done(err));
    });
  });
});
