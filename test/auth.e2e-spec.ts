import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { clearTestDatabase, seedTestDatabase } from '../test-seed';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

describe('Authentication System (e2e)', () => {
  let app: INestApplication;
  let connection: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], 
    }).compile();

    app = moduleFixture.createNestApplication();


    connection = app.get<DataSource>('eventwey_test');

    await app.init();
  });

  beforeEach(async () => {

    await seedTestDatabase();
    console.log('Database seeded before test');
  });

  afterEach(async () => {
    await clearTestDatabase();
    console.log('Database cleaned after test');
  });

  afterAll(async () => {
    if (connection) {
      await connection.destroy(); 
    }
    await app.close();
  });

  it('Handles a signup request', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'user1',
        email: 'testUser1@test.com',
        password: 'StrongPassword1#',
      })
      .expect(201)
      .then((res) => {
        const { id, email } = res.body;
        expect(id).toBeDefined();
        expect(email).toBe('testUser1@test.com'); 
      });
  });
});
