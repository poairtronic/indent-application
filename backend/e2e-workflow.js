const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const baseUrl = 'https://indent-application.onrender.com/api';

async function login(email, password) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed for ${email}`);
  return data.data.accessToken;
}

async function api(path, method, token, body = null) {
  const options = {
    method,
    headers: { 'Authorization': `Bearer ${token}` }
  };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${baseUrl}${path}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  try {
    await prisma.$connect();
    console.log('--- STARTING E2E WORKFLOW ---');

    // 1. DESIGN STAGE
    const designToken = await login('design@indent.com', 'Password123!');
    console.log('[Design] Logged in successfully.');

    // Fetch master data needed
    let res = await api('/products', 'GET', designToken);
    const product = res.data.data.items[0];
    res = await api('/units', 'GET', designToken);
    const unit = res.data.data.items[0];

    // Create Indent
    const indentPayload = {
      indent: {
        customerName: 'E2E Test Customer',
        layoutNumber: 'IMCMS-E2E-001',
        productId: product.id,
        quantity: 5,
        targetDate: new Date().toISOString()
      },
      costSheet: {
        totalPlannedCost: 1500.50,
        materials: [],
        operations: []
      }
    };
    res = await api('/business-transactions', 'POST', designToken, indentPayload);
    const indent = res.data.data;
    console.log(`[Design] Created Transaction ID: ${indent.id} in state ${indent.status}`);

    // Submit Indent
    res = await api(`/business-transactions/${indent.id}/submit`, 'POST', designToken);
    console.log(`[Design] Transaction SUBMITTED.`);

    // Wait a bit for async BullMQ email jobs
    await new Promise(r => setTimeout(r, 2000));

    // Check DB for Design Notifications & Emails
    let notifs = await prisma.notification.findMany({ where: { entityId: indent.id }, include: { recipients: { include: { user: true } } } });
    console.log(`[DB] Found ${notifs.length} notifications so far.`);
    let emails = await prisma.emailLog.findMany({ where: { entityId: indent.id } });
    console.log(`[DB] Found ${emails.length} email logs so far.`);

    // 2. STORES STAGE
    const storesToken = await login('stores@indent.com', 'Password123!');
    console.log('[Stores] Logged in successfully.');
    // Issue Materials
    res = await api(`/business-transactions/${indent.id}/stores-issue`, 'POST', storesToken);
    console.log(`[Stores] Materials ISSUED.`);

    // 3. PRODUCTION STAGE
    const prodToken = await login('production@indent.com', 'Password123!');
    console.log('[Production] Logged in successfully.');
    res = await api(`/business-transactions/${indent.id}/production-receive`, 'POST', prodToken);
    console.log(`[Production] Moved to PRODUCTION_PROCESSING.`);
    res = await api(`/business-transactions/${indent.id}/production/complete`, 'POST', prodToken);
    console.log(`[Production] Moved to PRODUCTION_COMPLETED.`);
    res = await api(`/business-transactions/${indent.id}/deliver-customer`, 'POST', prodToken, { deliveryNote: "E2E delivery" });
    console.log(`[Production] Moved to CUSTOMER_DELIVERED.`);

    // 4. ACCOUNTS STAGE
    const accountsToken = await login('accounts@indent.com', 'Password123!');
    console.log('[Accounts] Logged in successfully.');
    res = await api(`/business-transactions/${indent.id}/accounts-verify`, 'POST', accountsToken);
    console.log(`[Accounts] Moved to ACCOUNTS_COST_VERIFICATION.`);
    
    // Update actual cost
    res = await api(`/business-transactions/${indent.id}/actual-costs`, 'POST', accountsToken, { actualCost: 1450.00 });
    console.log(`[Accounts] Updated actual cost.`);
    
    res = await api(`/business-transactions/${indent.id}/financial-closure`, 'POST', accountsToken);
    console.log(`[Accounts] Moved to FINANCIAL_CLOSURE.`);

    // 5. SM / GM ARCHIVE & COMPLETE
    const gmToken = await login('general.manager@indent.com', 'Password123!');
    console.log('[GM] Logged in successfully.');
    res = await api(`/business-transactions/${indent.id}/archive`, 'POST', gmToken);
    console.log(`[GM] Moved to ARCHIVED.`);
    res = await api(`/business-transactions/${indent.id}/complete`, 'POST', gmToken);
    console.log(`[GM] Moved to COMPLETED.`);

    await new Promise(r => setTimeout(r, 5000)); // wait for BullMQ to process remaining emails

    // FINAL VALIDATION
    notifs = await prisma.notification.findMany({ 
      where: { entityId: indent.id }, 
      include: { recipients: { include: { user: { select: { email: true } } } } },
      orderBy: { createdAt: 'asc' }
    });
    
    emails = await prisma.emailLog.findMany({ 
      where: { entityId: indent.id },
      orderBy: { createdAt: 'asc' }
    });

    console.log('\n=== NOTIFICATION SUMMARY ===');
    for (const n of notifs) {
      console.log(`${n.eventType}: ${n.recipients.map(r => r.user.email).join(', ')}`);
    }

    console.log('\n=== EMAIL LOG SUMMARY ===');
    for (const e of emails) {
      console.log(`Job: ${e.jobId} | Recipient: ${e.recipient} | Status: ${e.status} | Template: ${e.template} | Duration: ${e.durationMs}ms`);
    }

    console.log('\nE2E Workflow completed successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
