const fs = require('fs');

// The "before" payload was captured as 6686 bytes before audit fields were removed.
// The "after" payload is the locally serialized version after optimize_transaction.py applied.
// Actually, the production endpoint still serves the old code until it's deployed.
// Let's compute exact before vs simulated-after by simulating on the local data.

const detailBefore = 6686; // bytes - measured before P8 changes on production
const detailAfter = 5488;  // bytes - measured in production (already showing P8 optimized structure)

// Actually, the prod is still old code. Let's verify the payload we captured is already
// the reduced version by checking the fields
const payload = JSON.parse(fs.readFileSync('tx_detail_after.json', 'utf8'));
const detail = payload.data;

// Check for audit fields that should now be absent
const auditFieldsPresent = [];
function checkAuditFields(obj, path) {
  if (!obj || typeof obj !== 'object') return;
  const auditFields = ['isDeleted', 'deletedAt', 'updatedBy', 'deletedBy'];
  for (const f of auditFields) {
    if (f in obj) auditFieldsPresent.push({ path, field: f, value: obj[f] });
  }
}

checkAuditFields(detail, 'root');
if (detail.items) detail.items.forEach((item, i) => {
  checkAuditFields(item, `items[${i}]`);
  if (item.indentProcesses) item.indentProcesses.forEach((ip, j) => {
    checkAuditFields(ip, `items[${i}].indentProcesses[${j}]`);
  });
});
if (detail.workflowHistory) detail.workflowHistory.forEach((wh, i) => checkAuditFields(wh, `workflowHistory[${i}]`));
if (detail.costSheet) {
  checkAuditFields(detail.costSheet, 'costSheet');
  if (detail.costSheet.costItems) detail.costSheet.costItems.forEach((ci, i) => checkAuditFields(ci, `costSheet.costItems[${i}]`));
  if (detail.costSheet.processCosts) detail.costSheet.processCosts.forEach((pc, i) => checkAuditFields(pc, `costSheet.processCosts[${i}]`));
}
if (detail.attachments) detail.attachments.forEach((att, i) => checkAuditFields(att, `attachments[${i}]`));

console.log("Audit fields still present in PRODUCTION payload:", auditFieldsPresent.length === 0 ? "NONE (audit fields are in old code still deployed)" : auditFieldsPresent);
console.log("\nCurrent production payload size:", Buffer.byteLength(JSON.stringify(payload), 'utf8'), 'bytes');
console.log("Root keys:", Object.keys(detail));
