import { CustomerRecord, etlProcessRecord, saveErrorBatch } from '../etlProcessor';
import { mongoClient } from '../utils/dbClient';
import logger from '../utils/logger';

export async function jobTransformLoad() {
  logger.info('Job Transform-Load started');
  await mongoClient.connect();
  const db = mongoClient.db(process.env.MONGO_DB);
  const rawCollection = db.collection('raw_customer_data');

  try {
    const rawData = await rawCollection.find({}).toArray();

    for (const doc of rawData) {
      // Ép kiểu qua unknown để tránh lỗi TS
      const possibleRecord = doc as unknown;

      // Kiểm tra tồn tại và kiểu của các trường bắt buộc
      if (
        typeof (possibleRecord as any).id === 'string' &&
        typeof (possibleRecord as any).source === 'string'
      ) {
        const record = possibleRecord as CustomerRecord;
        try {
          await etlProcessRecord(db, record);
        } catch (err: any) {
          logger.error(`ETL processing record id=${record.id} failed: ${err.message}`);
          await saveErrorBatch(db, record, err.message, 'transform_load');
        }
      } else {
        logger.warn('Skipping record due to missing id or source', doc);
      }
    }

    logger.info('Job Transform-Load finished');
  } catch (err: any) {
    logger.error(`Job Transform-Load failed: ${err.message}`);
  } finally {
    await mongoClient.close();
  }
}
