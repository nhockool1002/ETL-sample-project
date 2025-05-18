import axios from 'axios';
import { Db } from 'mongodb';
import { pgClient, mongoClient } from '../utils/dbClient';
import logger from '../utils/logger';
import { retryWrapper } from '../utils/retryHelper';
import { saveErrorBatch } from '../etlProcessor';

interface ApiCustomerRecord {
    id: string;
    name: string;
    email: string;
    phone: string;
    // các trường khác nếu có
  }

async function extractFromSQL(lastUpdated?: string) {
    await pgClient.connect();
    let query = `SELECT id, name, email, phone, updated_at FROM customers`;
    if (lastUpdated) {
        query += ` WHERE updated_at > $1`;
    }
    const res = lastUpdated ? await pgClient.query(query, [lastUpdated]) : await pgClient.query(query);
    await pgClient.end();
    return res.rows.map(row => ({ ...row, source: 'SQL' }));
}

async function extractFromAPI(lastUpdated?: string) {
    const url = new URL(process.env.API_URL ?? '');
    if (lastUpdated) {
      url.searchParams.append('updatedAfter', lastUpdated);
    }
    const apiResp = await retryWrapper(async () => {
      return await axios.get<ApiCustomerRecord[]>(url.toString(), {
        headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
        timeout: 10000,
      });
    });
    return apiResp.data.map(rec => ({ ...rec, source: 'API' }));
  }
  

async function extractFromBatchMonitor(db: any) {
  const monitorCol = db.collection('batch_monitor');
  const errorBatches = await monitorCol.find({ status: { $in: ['pending', 'retrying'] } }).toArray();
  return errorBatches.map((batch: any) => ({ ...batch.batch_data, source: 'BATCH_RETRY' }));
}

async function getLastRunTime(db: Db, jobName: string): Promise<string | null> {
    const metaCol = db.collection('etl_metadata');
    const meta = await metaCol.findOne({ job: jobName });
    return meta ? meta.lastRun : null;
  }
  
  async function updateLastRunTime(db: Db, jobName: string, timestamp: string) {
    const metaCol = db.collection('etl_metadata');
    await metaCol.updateOne(
      { job: jobName },
      { $set: { lastRun: timestamp } },
      { upsert: true }
    );
  }

export async function jobExtract() {
    logger.info('Job Extract started');
    await mongoClient.connect();
    const db = mongoClient.db(process.env.MONGO_DB);
    const rawCollection = db.collection('raw_customer_data');
  
    try {
      const lastRun = await getLastRunTime(db, 'jobExtract');
      const sqlData = await extractFromSQL(lastRun ?? undefined);
      const apiData = await extractFromAPI(lastRun ?? undefined);
      const batchRetryData = await extractFromBatchMonitor(db);
  
      const combinedData = [...sqlData, ...apiData, ...batchRetryData];
  
      await rawCollection.deleteMany({});
      await rawCollection.insertMany(combinedData);
  
      await updateLastRunTime(db, 'jobExtract', new Date().toISOString());
  
      logger.info(`Job Extract: Inserted ${combinedData.length} records into raw_customer_data`);
    } catch (err: any) {
      logger.error(`Job Extract failed: ${err.message}`);
      await saveErrorBatch(db, {}, err.message, 'extract');
    } finally {
      await mongoClient.close();
    }
  }
  
