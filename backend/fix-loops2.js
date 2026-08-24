const fs = require('fs');
let f = 'src/business-transaction/services/business-transaction.service.ts';
let t = fs.readFileSync(f, 'utf8');

const regex = /for\s*\(\s*const\s+recId\s+of\s+uniqueUserIds\s*\)\s*\{\s*await\s+this\.prisma\.auditLog\.create\(\{\s*data:\s*\{\s*module:\s*'NOTIFICATIONS',\s*recordId:\s*notification\.id,\s*action:\s*'DELIVER',\s*newValue:\s*\{\s*recipientUserId:\s*recId\s*\},?\s*performedBy:\s*userId\s*\|\|\s*'SYSTEM',?\s*\},?\s*\}\);\s*\}/g;

const replace = `const auditLogs = uniqueUserIds.map((recId) => ({
            module: 'NOTIFICATIONS',
            recordId: notification.id,
            action: 'DELIVER',
            newValue: { recipientUserId: recId },
            performedBy: userId || 'SYSTEM',
          }));
          await this.prisma.auditLog.createMany({ data: auditLogs });`;

let newT = t.replace(regex, replace);
if (newT !== t) {
  console.log("Replaced successfully!");
} else {
  console.log("No match found.");
}
fs.writeFileSync(f, newT);
