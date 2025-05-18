import cron from 'node-cron';
import { jobExtract } from './jobs/extractJob';
import { jobTransformLoad } from './jobs/transformLoadJob';
import { retryBatchMonitor } from './jobs/retryBatchMonitorJob';
import logger from './utils/logger';

cron.schedule('*/10 * * * *', () => {
  logger.info('Scheduled Job: Extract Data');
  jobExtract().catch(err => logger.error(`JobExtract error: ${err.message}`));
});

cron.schedule('5,20,35,50 * * * *', () => {
  logger.info('Scheduled Job: Transform & Load');
  jobTransformLoad().catch(err => logger.error(`JobTransformLoad error: ${err.message}`));
});

cron.schedule('*/30 * * * *', () => {
  logger.info('Scheduled Job: Batch Monitor Retry');
  retryBatchMonitor().catch(err => logger.error(`JobBatchMonitorRetry error: ${err.message}`));
});

(async () => {
  try {
    await jobExtract();
    await jobTransformLoad();
    await retryBatchMonitor();
  } catch (err: any) {
    logger.error(`Initial ETL run error: ${err.message}`);
  }
})();
