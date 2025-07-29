import { Client } from 'pg';

const TEST_DB_NAME = 'test_db';
const POSTGRES_USER = 'postgres';
const POSTGRES_PASSWORD = 'password';
const POSTGRES_HOST = 'localhost';
const POSTGRES_PORT = 5432;

export async function recreateTestDatabase() {
  const client = new Client({
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: 'postgres',
  });

  await client.connect();

  await client.query(`
    SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TEST_DB_NAME}';
  `);

  await client.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
  await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);

  await client.end();
}
