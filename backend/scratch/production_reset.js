const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'imcms-attachments';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("==========================================");
  console.log("STARTING PRODUCTION DATA RESET");
  console.log("==========================================");

  try {
    // 1. DELETE PHYSICAL ATTACHMENTS
    console.log("\n1. Deleting physical attachments from Supabase...");
    const attachments = await prisma.indentAttachment.findMany();
    if (attachments.length > 0) {
      const filePaths = attachments.map(a => {
        try {
          const meta = JSON.parse(a.fileName);
          return meta.path || a.fileUrl.split('/').pop();
        } catch (e) {
          return a.fileUrl.split('/').pop();
        }
      }).filter(Boolean);
      
      console.log(`Found ${filePaths.length} physical files to delete.`);
      if (filePaths.length > 0) {
        const { data, error } = await supabase.storage.from(bucketName).remove(filePaths);
        if (error) {
          console.error("Failed to delete from Supabase:", error);
        } else {
          console.log(`Successfully deleted ${data.length} files from Supabase.`);
        }
      }
    } else {
      console.log("No attachments found.");
    }

    // 2. DELETE DATABASE RECORDS IN TRANSACTION
    console.log("\n2. Executing database cleanup transaction...");
    
    // Order matters (bottom-up)
    const results = await prisma.$transaction([
      // Infrastructure & Logs
      prisma.emailJob.deleteMany(),
      prisma.emailLog.deleteMany(),
      prisma.notificationRecipient.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.userSession.deleteMany(),
      prisma.refreshToken.deleteMany(),
      // Dependent Indent Nodes
      prisma.indentProcess.deleteMany(),
      prisma.indentBroughtMaterial.deleteMany(),
      prisma.indentItem.deleteMany(),
      prisma.workflowHistory.deleteMany(),
      prisma.indentHistory.deleteMany(),
      prisma.productionReceipt.deleteMany(),
      prisma.additionalMaterialRequest.deleteMany(),
      // Financials
      prisma.processCost.deleteMany(),
      prisma.costItem.deleteMany(),
      prisma.costSheet.deleteMany(),
      // Attachments DB records
      prisma.indentAttachment.deleteMany(),
      // Core Transaction
      prisma.indent.deleteMany()
    ]);

    console.log("\nDatabase cleanup successful. Rows deleted:");
    const models = [
      'EmailJob', 'EmailLog', 'NotificationRecipient', 'Notification', 
      'UserSession', 'RefreshToken', 'IndentProcess', 'IndentBroughtMaterial', 
      'IndentItem', 'WorkflowHistory', 'IndentHistory', 'ProductionReceipt', 
      'AdditionalMaterialRequest', 'ProcessCost', 'CostItem', 'CostSheet', 
      'IndentAttachment', 'Indent'
    ];
    
    results.forEach((res, i) => {
      console.log(`- ${models[i]}: ${res.count}`);
    });

    console.log("\n==========================================");
    console.log("PRODUCTION DATA RESET COMPLETED SUCCESSFULLY");
    console.log("==========================================");
    
  } catch (err) {
    console.error("\nCRITICAL FAILURE DURING RESET:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
