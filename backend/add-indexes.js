const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Adding composite indexes via raw SQL...');
    
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "audit_logs_record_id_created_at_idx" ON "audit_logs" ("recordId", "createdAt" DESC)`);
    console.log('Added audit_logs index');
    
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "workflow_history_indent_id_created_at_idx" ON "workflow_history" ("indentId", "createdAt" DESC)`);
    console.log('Added workflow_history index');
    
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "indent_history_indent_id_created_at_idx" ON "indent_history" ("indentId", "createdAt" DESC)`);
    console.log('Added indent_history index');
    
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "notification_recipients_created_at_idx" ON "notification_recipients" ("createdAt" DESC)`);
    console.log('Added notification_recipients index');
    
    console.log('All indexes added successfully.');
  } catch (err) {
    console.error('Failed to add indexes', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
