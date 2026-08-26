const fs = require('fs');

// Simulate the before (with audit fields) to get a precise before size
const payload = JSON.parse(fs.readFileSync('tx_detail_after.json', 'utf8'));
const detail = JSON.parse(JSON.stringify(payload.data));

// Re-inject the audit fields that would have been returned by the old `include` approach
function addAuditFields(obj) {
  if (!obj || typeof obj !== 'object') return;
  obj.isDeleted = false;
  obj.deletedAt = null;
  obj.createdBy = null;
  obj.updatedBy = null;
  obj.deletedBy = null;
}

addAuditFields(detail);
if (detail.items) detail.items.forEach(item => {
  addAuditFields(item);
  if (item.indentProcesses) item.indentProcesses.forEach(ip => addAuditFields(ip));
});
if (detail.attachments) detail.attachments.forEach(att => addAuditFields(att));
if (detail.costSheet) {
  addAuditFields(detail.costSheet);
  if (detail.costSheet.costItems) detail.costSheet.costItems.forEach(ci => addAuditFields(ci));
  if (detail.costSheet.processCosts) detail.costSheet.processCosts.forEach(pc => addAuditFields(pc));
}
if (detail.workflowHistory) detail.workflowHistory.forEach(wh => addAuditFields(wh));

const beforeStr = JSON.stringify({ ...payload, data: detail });
const afterStr = fs.readFileSync('tx_detail_after.json', 'utf8');

const beforeBytes = Buffer.byteLength(beforeStr, 'utf8');
const afterBytes = Buffer.byteLength(afterStr, 'utf8');

console.log('Transaction Detail - BEFORE (with audit fields):', beforeBytes, 'bytes');
console.log('Transaction Detail - AFTER (P8 optimized):', afterBytes, 'bytes');
console.log('Reduction:', (beforeBytes - afterBytes), 'bytes', '(' + ((beforeBytes - afterBytes)/beforeBytes * 100).toFixed(1) + '%)');

// Show item and process counts
const d = JSON.parse(afterStr).data;
console.log('\nItems:', d.items?.length);
console.log('indentProcesses per item:', d.items?.map(i => i.indentProcesses?.length).join(', '));
console.log('costItems:', d.costSheet?.costItems?.length);
console.log('processCosts:', d.costSheet?.processCosts?.length);
console.log('workflowHistory entries:', d.workflowHistory?.length);
console.log('attachments:', d.attachments?.length);
