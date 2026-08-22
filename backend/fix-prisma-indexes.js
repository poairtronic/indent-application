const fs = require('fs');
const target = '../database/schema.prisma';
let code = fs.readFileSync(target, 'utf8');

const auditLogSearch = `  @@index([module])
  @@index([recordId])`;
const auditLogReplace = `  @@index([module])
  @@index([recordId, createdAt(sort: Desc)])
  @@index([recordId])`;
code = code.replace(auditLogSearch, auditLogReplace);

const workflowHistorySearch = `  @@index([indentId])
  @@index([fromDepartmentId])`;
const workflowHistoryReplace = `  @@index([indentId, createdAt(sort: Desc)])
  @@index([indentId])
  @@index([fromDepartmentId])`;
code = code.replace(workflowHistorySearch, workflowHistoryReplace);

const indentHistorySearch = `  @@index([indentId])
  @@index([changedBy])`;
const indentHistoryReplace = `  @@index([indentId, createdAt(sort: Desc)])
  @@index([indentId])
  @@index([changedBy])`;
code = code.replace(indentHistorySearch, indentHistoryReplace);

const notificationSearch = `  @@index([isRead])
  @@index([isDeleted])`;
const notificationReplace = `  @@index([createdAt(sort: Desc)])
  @@index([isRead])
  @@index([isDeleted])`;
code = code.replace(notificationSearch, notificationReplace);

fs.writeFileSync(target, code, 'utf8');
console.log('Prisma composite indexes added safely.');
