import { mongoClient } from '../utils/dbClient';
import logger from '../utils/logger';
import { etlProcessRecord } from '../etlProcessor';

const MAX_RETRY = 3;

export async function retryBatchMonitor() {
  logger.info('Job Batch Monitor Retry started');
  await mongoClient.connect();
  const db = mongoClient.db(process.env.MONGO_DB);
  const monitorCol = db.collection('batch_monitor');

  try {
    const pendingBatches = await monitorCol.find({ status: { $in: ['pending', 'retrying'] } }).toArray();
    for (const batch of pendingBatches) {
      try {
        await etlProcessRecord(db, batch.batch_data);
        await monitorCol.updateOne({ _id: batch._id }, { $set: { status: 'done' } });
        logger.info(`Batch retry success id=${batch._id}`);
      } catch (err: any) {
        const newRetryCount = batch.retry_count + 1;
        let updateFields = {
          error_message: err.message,
          retry_count: newRetryCount,
          last_retry_time: new Date(),
          status: 'retrying',
        };
        if (newRetryCount >= MAX_RETRY) {
          updateFields.status = 'failed';
          logger.error(`Batch retry failed permanently id=${batch._id}`);
        }
        await monitorCol.updateOne({ _id: batch._id }, { $set: updateFields });
        logger.error(`Batch retry failed id=${batch._id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    logger.error(`Batch Monitor Retry job failed: ${err.message}`);
  } finally {
    await mongoClient.close();
  }
}
