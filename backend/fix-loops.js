const fs = require('fs');
let f = 'src/business-transaction/services/business-transaction.service.ts';
let t = fs.readFileSync(f, 'utf8');

const search = `for (const recId of uniqueUserIds) {
          await this.prisma.auditLog.create({
            data: {
              module: 'NOTIFICATIONS',
              recordId: notification.id,
              action: 'DELIVER',
              newValue: { recipientUserId: recId },
              performedBy: userId || 'SYSTEM',
            },
          });
        }`;

const replace = `if (uniqueUserIds.length > 0) {
          const auditLogs = uniqueUserIds.map((recId) => ({
            module: 'NOTIFICATIONS',
            recordId: notification.id,
            action: 'DELIVER',
            newValue: { recipientUserId: recId },
            performedBy: userId || 'SYSTEM',
          }));
          await this.prisma.auditLog.createMany({ data: auditLogs });
        }`;

// Using split/join to replace all occurrences literally
t = t.split(search).join(replace);
fs.writeFileSync(f, t);
