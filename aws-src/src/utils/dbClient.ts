import { MongoClient, MongoClientOptions } from 'mongodb';
import { Client as PgClient } from 'pg';
import dotenv from 'dotenv';
import { getSecret } from './secretsManager';

dotenv.config();

async function getPgConnectionString(): Promise<string> {
  if (process.env.USE_AWS_SECRETS === 'true') {
    const secret = await getSecret(process.env.PG_SECRET_NAME ?? '');
    return JSON.parse(secret).connectionString;
  }
  return process.env.PG_CONNECTION_STRING ?? '';
}

async function getMongoUri(): Promise<string> {
  if (process.env.USE_AWS_SECRETS === 'true') {
    const secret = await getSecret(process.env.MONGO_SECRET_NAME ?? '');
    return JSON.parse(secret).uri;
  }
  return process.env.MONGO_URI ?? '';
}

export let pgClient: PgClient;
export let mongoClient: MongoClient;

(async () => {
  const pgConnStr = await getPgConnectionString();
  pgClient = new PgClient({ connectionString: pgConnStr, ssl: { rejectUnauthorized: false } });

  const mongoUri = await getMongoUri();
  mongoClient = new MongoClient(mongoUri, { tls: true });
})();
