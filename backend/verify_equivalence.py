# Verify the equivalence of all required fields
import json

with open('tx_detail_after.json', 'r') as f:
    after = json.load(f)

d = after['data']

# Required field checklist
required_fields = [
    'id', 'indentNumber', 'customerName', 'layoutNumber', 'productId', 'productName',
    'departmentId', 'departmentName', 'priority', 'currentState', 'currentLoop',
    'requiredDate', 'requiredDeliveryDate', 'purpose', 'remarks', 'createdBy',
    'createdAt', 'updatedAt', 'items', 'attachments', 'costSheet',
    'productionReceipt', 'workflowHistory', 'allowedNextStates'
]

print("=== Field Equivalence Check ===")
for field in required_fields:
    status = "PRESENT" if field in d else "MISSING"
    print(f"  {field}: {status}")

# Check nested fields
print("\n=== Items Field Check ===")
if d.get('items'):
    item = d['items'][0]
    item_required = ['id', 'indentId', 'materialId', 'quantity', 'issuedQuantity', 
                     'unitId', 'shape', 'lengthMm', 'widthMm', 'heightMm', 'unitWeightKg',
                     'totalWeightKg', 'remarks', 'status', 'material', 'unit', 'indentProcesses']
    for f in item_required:
        status = "PRESENT" if f in item else "MISSING"
        print(f"  {f}: {status}")

print("\n=== CostSheet Field Check ===")
if d.get('costSheet'):
    cs = d['costSheet']
    cs_required = ['id', 'costNumber', 'designCost', 'overheadCost', 'contingencyCost',
                   'actualDesignCost', 'actualOverheadCost', 'actualContingencyCost',
                   'predictedTotal', 'actualTotal', 'varianceAmount', 'variancePercentage',
                   'status', 'costItems', 'processCosts']
    for f in cs_required:
        status = "PRESENT" if f in cs else "MISSING"
        print(f"  {f}: {status}")
    
    if cs.get('costItems'):
        ci = cs['costItems'][0]
        ci_required = ['id', 'materialId', 'vendorId', 'predictedRate', 'predictedQuantity',
                       'predictedAmount', 'actualRate', 'actualQuantity', 'actualAmount',
                       'remarks', 'material', 'vendor']
        print("\n  CostItem fields:")
        for f in ci_required:
            status = "PRESENT" if f in ci else "MISSING"
            print(f"    {f}: {status}")

print("\n=== WorkflowHistory Field Check ===")
if d.get('workflowHistory') and len(d['workflowHistory']) > 0:
    wh = d['workflowHistory'][0]
    wh_required = ['id', 'indentId', 'fromDepartmentId', 'toDepartmentId', 'movedAt', 'remarks', 'mover', 'toDepartment']
    for f in wh_required:
        status = "PRESENT" if f in wh else "MISSING"
        print(f"  {f}: {status}")
