import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Applying composite indexes for notifications and audit logs on PostgreSQL...');

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_notifications_deleted_event_created 
    ON notifications ("isDeleted", "eventType", "createdAt" DESC);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_recipients_user_read_deleted 
    ON notification_recipients ("userId", "isRead", "isDeleted");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_module_created 
    ON audit_logs ("module", "createdAt" DESC);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created 
    ON audit_logs ("createdAt" DESC);
  `);

  console.log('All composite indexes created successfully!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
