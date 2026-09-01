import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

async function audit() {
  const prisma = new PrismaClient();
  try {
    const totalLogs = await prisma.emailLog.count();
    const totalJobs = await prisma.emailJob.count();
    
    // Status counts in EmailLog
    const sentCount = await prisma.emailLog.count({ where: { status: 'SENT' }});
    const pendingLogCount = await prisma.emailLog.count({ where: { status: 'PENDING' }});
    const retryingLogCount = await prisma.emailLog.count({ where: { status: 'RETRYING' }});
    const failedLogCount = await prisma.emailLog.count({ where: { status: 'FAILED' }});
    const deadLetterLogCount = await prisma.emailLog.count({ where: { status: 'DEAD_LETTER' }});
    
    // Status counts in EmailJob
    const pendingJobCount = await prisma.emailJob.count({ where: { status: 'PENDING' }});
    const processingJobCount = await prisma.emailJob.count({ where: { status: 'PROCESSING' }});
    const failedJobCount = await prisma.emailJob.count({ where: { status: 'FAILED' }});
    const deadLetterJobCount = await prisma.emailJob.count({ where: { status: 'DEAD_LETTER' }});

    // Time based
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const todayLogCount = await prisma.emailLog.count({ where: { sentAt: { gte: yesterday } }});
    
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7LogCount = await prisma.emailLog.count({ where: { sentAt: { gte: last7Days } }});

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const last30LogCount = await prisma.emailLog.count({ where: { sentAt: { gte: last30Days } }});

    const lastSuccessful = await prisma.emailLog.findFirst({
      where: { status: 'SENT' },
      orderBy: { sentAt: 'desc' }
    });

    const lastFailed = await prisma.emailLog.findFirst({
      where: { status: { in: ['FAILED', 'DEAD_LETTER', 'RETRYING'] } },
      orderBy: { sentAt: 'desc' }
    });

    const dbSizeQuery = await prisma.$queryRaw`
      SELECT relname as table_name, pg_size_pretty(pg_total_relation_size(C.oid)) as total_size
      FROM pg_class C
      LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
      WHERE nspname NOT IN ('pg_catalog', 'information_schema')
      AND C.relkind <> 'i'
      AND nspname !~ '^pg_toast'
      AND relname IN ('email_logs', 'email_jobs')
    `;

    console.log(JSON.stringify({
      totals: {
        logs: totalLogs,
        jobs: totalJobs
      },
      logStatus: {
        sent: sentCount,
        pending: pendingLogCount,
        retrying: retryingLogCount,
        failed: failedLogCount,
        deadLetter: deadLetterLogCount
      },
      jobStatus: {
        pending: pendingJobCount,
        processing: processingJobCount,
        failed: failedJobCount,
        deadLetter: deadLetterJobCount
      },
      timeBased: {
        today: todayLogCount,
        last7: last7LogCount,
        last30: last30LogCount
      },
      trace: {
        lastSuccessful: lastSuccessful,
        lastFailed: lastFailed
      },
      dbSizes: dbSizeQuery
    }, null, 2));

  } catch (e) {
    console.error('Audit failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

audit();
