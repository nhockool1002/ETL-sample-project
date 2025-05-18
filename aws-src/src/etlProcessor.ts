import { Db } from 'mongodb';
import logger from './utils/logger';
import validator from 'validator';
import crypto from 'crypto';

export interface CustomerRecord {
  id: string;
  source: 'SQL' | 'API' | 'BATCH_RETRY';
  email?: string;
  phone?: string;
  [key: string]: any;
}

const validStatuses = ['active', 'inactive', 'pending'];

// Khóa và IV cho AES (32 bytes key, 16 bytes IV)
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', 'utf-8'); // 32 bytes
const IV = Buffer.from(process.env.ENCRYPTION_IV || 'abcdef9876543210', 'utf-8'); // 16 bytes

function encrypt(text: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export interface CustomerRecord {
    id: string;
    source: 'SQL' | 'API' | 'BATCH_RETRY';
    email?: string;
    phone?: string;
}
  
export async function saveErrorBatch(db: Db, record: CustomerRecord | {}, errorMessage: string, errorType = 'system'): Promise<void> {
const monitorCol = db.collection('batch_monitor');
await monitorCol.insertOne({
    batch_data: record,
    error_message: errorMessage,
    error_type: errorType,
    timestamp: new Date(),
    status: 'pending',
    retry_count: 0,
});
logger.warn(`Saved error batch: ${errorMessage}`);
}

export async function etlProcessRecord(db: Db, record: CustomerRecord): Promise<void> {
  const customerCol = db.collection('customers');

  if (!record.id) throw new Error('Missing id field');

  if (record.email && !validator.isEmail(record.email)) {
    throw new Error(`Invalid email format: ${record.email}`);
  }

  if (record.phone && !validator.isMobilePhone(record.phone, 'any')) {
    throw new Error(`Invalid phone format: ${record.phone}`);
  }

  if (record.birthDate && !validator.isISO8601(record.birthDate)) {
    throw new Error(`Invalid birthDate format: ${record.birthDate}`);
  }

  if (record.status && !validStatuses.includes(record.status)) {
    throw new Error(`Invalid status value: ${record.status}`);
  }

  // sensitive
  if (record.email) record.email = encrypt(record.email);
  if (record.phone) record.phone = encrypt(record.phone);

  try {
    const existing = await customerCol.findOne({ id: record.id });
    if (!existing || record.source === 'API' || record.source === 'BATCH_RETRY') {
      await customerCol.replaceOne({ id: record.id }, record, { upsert: true });
      logger.info(`Upserted customer id=${record.id}`);
    }
  } catch (err) {
    logger.error(`DB error processing record id=${record.id}: ${(err as Error).message}`);
    throw err;
  }
}
