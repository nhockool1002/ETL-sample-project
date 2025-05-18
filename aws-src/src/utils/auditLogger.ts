import { Db } from 'mongodb';

export async function auditLog(db: Db, userId: string, action: string, details: any) {
  const auditCol = db.collection('audit_logs');
  await auditCol.insertOne({
    userId,
    action,
    details,
    timestamp: new Date(),
  });
}
