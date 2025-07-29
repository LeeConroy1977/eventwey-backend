import './setup';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearTestDatabase, seedTestDatabase } from '../db/seeds/test-seed';
import { groupData, userData, eventData } from '../db/data/test-data/index';
import { createConnection, getConnection } from 'typeorm';
import { recreateTestDatabase } from '../db/db-manager';
import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';

export function generateTestToken(payload: { sub: number; email: string }) {
  const secret = process.env.JWT_SECRET || 'password'; 
  return jwt.sign({ ...payload, id: payload.sub }, secret, {
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('EventWey API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    await recreateTestDatabase();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
    await seedTestDatabase(dataSource, { userData, eventData, groupData });
  });

  afterAll(async () => {
    await clearTestDatabase(dataSource);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('Invalid Endpoint', () => {
    it('GET /api/9999 should return 404 for invalid endpoint', () => {
      return request(app.getHttpServer()).get('/9999').expect(404).expect({
        message: 'Cannot GET /9999',
        error: 'Not Found',
        statusCode: 404,
      });
    });
  });

  describe('/groups', () => {
    it('GET /api/groups should return 200 and an array of groups with correct length and datatypes', () => {
      return request(app.getHttpServer())
        .get('/groups')
        .expect(200)
        .expect((res) => {
          const groups = res.body;

          expect(groups).toHaveLength(3);
          groups.forEach((group: any) => {
            expect(typeof group.name).toBe('string');
            expect(typeof group.category).toBe('string');
            expect(typeof group.openAccess).toBe('boolean');
            expect(Array.isArray(group.description)).toBe(true);
            expect(Array.isArray(group.groupAdmins)).toBe(true);
          });
        });
    });

    it('GET groups should return 200 and first group matches expected object', () => {
      return request(app.getHttpServer())
        .get('/groups')
        .expect(200)
        .expect((res) => {
          const groups = res.body;
          expect(groups[0]).toMatchObject({
            id: 1,
            name: 'Tech Enthusiasts',
            image:
              'https://promptzone-community.s3.amazonaws.com/uploads/articles/05jtetckc5asjbeto03g.jpeg',
            description: [
              'A group for tech enthusiasts, from coders to hardware lovers.',
              "Join a vibrant community where we explore the latest tech trends, share coding tips, and build innovative projects. Whether you're a seasoned developer or just starting out, you'll find like-minded individuals here.",
              "The group hosts weekly discussions about emerging technologies, coding best practices, and hardware projects. It's a great place for collaboration and networking.",
              'We also organize events like hackathons and coding challenges to help members improve their skills and learn new technologies in a fun, competitive environment.',
            ],
            openAccess: true,
            location: {
              placename: 'Weymouth Library',
              lng: -2.4512,
              lat: 50.6105,
            },
            category: 'technology',
            approved: true,
            events: [1],
            creationDate: expect.any(String),
            groupAdmins: [1],
            members: [],
          });
          expect(groups[0].groupAdmins[0]).toBe(1);
          expect(groups[0].events).toMatchObject([1]);
          expect(groups[1].name).toBe('Weymouth Foodies');
        });
    });
    describe('/groups', () => {
      it('POST /groups/:id/join should join user to group.members', async () => {
        const token = generateTestToken({ sub: 1, email: 'lily1@gmail.com' }); 
        return request(app.getHttpServer())
          .post('/groups/1/join')
          .set('Authorization', `Bearer ${token}`)
          .expect(201)
          .expect((res) => {
            const group = res.body;
            console.log(group, 'xxxxxxxxxxxxxxxxxx');
            expect(group).toHaveProperty('members');
            expect(Array.isArray(group.members)).toBe(true);
            expect(group.members).toMatchObject([1]);
          });
      });
    });
  });
});
