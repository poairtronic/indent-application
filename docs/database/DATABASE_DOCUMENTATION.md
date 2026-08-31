# DATABASE DOCUMENTATION

## Table: Department

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| departmentCode | String | NO | NO | |
| departmentName | String | NO | NO | |
| description | String? | YES | NO | |
| status | DepartmentStatus | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| users | User[] | NO | NO | |
| indents | Indent[] | NO | NO | |
| workflowFrom | WorkflowHistory[] | NO | YES | |
| workflowTo | WorkflowHistory[] | NO | YES | |
| departmentBudgets | DepartmentBudget[] | NO | NO | |

## Table: Role

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| roleName | String | NO | NO | |
| description | String? | YES | NO | |
| isSystem | Boolean | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| users | User[] | NO | NO | |
| rolePermissions | RolePermission[] | NO | NO | |

## Table: Permission

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| module | String | NO | NO | |
| action | PermissionAction | NO | NO | |
| code | String | NO | NO | |
| description | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| rolePermissions | RolePermission[] | NO | NO | |

## Table: RolePermission

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| roleId | String | NO | NO | |
| permissionId | String | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| role | Role | NO | YES | |
| permission | Permission | NO | YES | |

## Table: User

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| employeeCode | String | NO | NO | |
| firstName | String | NO | NO | |
| lastName | String | NO | NO | |
| email | String | NO | NO | |
| phone | String? | YES | NO | |
| password | String | NO | NO | |
| departmentId | String | NO | NO | |
| roleId | String | NO | NO | |
| status | UserStatus | NO | NO | |
| profileImage | String? | YES | NO | |
| lastLogin | DateTime? | YES | NO | |
| failedLoginAttempts | Int | NO | NO | |
| lockedAt | DateTime? | YES | NO | |
| lockedUntil | DateTime? | YES | NO | |
| lastPasswordChange | DateTime? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| department | Department | NO | YES | |
| role | Role | NO | YES | |
| indentsCreated | Indent[] | NO | YES | |
| attachmentsUploaded | IndentAttachment[] | NO | NO | |
| costSheetsPrepared | CostSheet[] | NO | YES | |
| amrRequested | AdditionalMaterialRequest[] | NO | YES | |
| amrApproved | AdditionalMaterialRequest[] | NO | YES | |
| workflowMoves | WorkflowHistory[] | NO | NO | |
| productionReceipts | ProductionReceipt[] | NO | NO | |
| indentChanges | IndentHistory[] | NO | NO | |
| notificationRecipients | NotificationRecipient[] | NO | NO | |
| notificationsCreated | Notification[] | NO | YES | |
| emailLogs | EmailLog[] | NO | NO | |
| auditLogs | AuditLog[] | NO | NO | |
| activityLogs | ActivityLog[] | NO | NO | |
| reportsGenerated | Report[] | NO | NO | |
| reportDownloads | ReportDownload[] | NO | NO | |
| sessions | UserSession[] | NO | NO | |
| refreshTokens | RefreshToken[] | NO | NO | |
| passwordResetTokens | PasswordResetToken[] | NO | NO | |
| fileUploads | FileUpload[] | NO | NO | |
| dashboardPreferences | DashboardPreference[] | NO | NO | |
| timelineActivities | Timeline[] | NO | NO | |

## Table: Vendor

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| vendorCode | String | NO | NO | |
| vendorName | String | NO | NO | |
| email | String | NO | NO | |
| phone | String? | YES | NO | |
| gstNumber | String? | YES | NO | |
| panNumber | String? | YES | NO | |
| address | String | NO | NO | |
| city | String | NO | NO | |
| state | String | NO | NO | |
| country | String | NO | NO | |
| pincode | String | NO | NO | |
| status | VendorStatus | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| materialVendors | MaterialVendor[] | NO | NO | |
| costItems | CostItem[] | NO | NO | |

## Table: Unit

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| unitCode | String | NO | NO | |
| unitName | String | NO | NO | |
| symbol | String | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| materials | Material[] | NO | NO | |
| indentItems | IndentItem[] | NO | NO | |
| amrItems | AdditionalMaterialItem[] | NO | NO | |

## Table: Material

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| materialCode | String | NO | NO | |
| materialName | String | NO | NO | |
| description | String? | YES | NO | |
| unitId | String | NO | NO | |
| minimumStock | Decimal | NO | NO | |
| maximumStock | Decimal | NO | NO | |
| currentStock | Decimal | NO | NO | |
| category | String | NO | NO | |
| densityKgPerDm3 | Decimal? | YES | NO | |
| status | MaterialStatus | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| unit | Unit | NO | YES | |
| materialVendors | MaterialVendor[] | NO | NO | |
| productMaterials | ProductMaterial[] | NO | NO | |
| indentItems | IndentItem[] | NO | NO | |
| costItems | CostItem[] | NO | NO | |
| amrItems | AdditionalMaterialItem[] | NO | NO | |

## Table: MaterialVendor

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| materialId | String | NO | NO | |
| vendorId | String | NO | NO | |
| leadTimeDays | Int? | YES | NO | |
| unitPrice | Decimal? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| material | Material | NO | YES | |
| vendor | Vendor | NO | YES | |

## Table: Product

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| productCode | String | NO | NO | |
| productName | String | NO | NO | |
| drawingNumber | String? | YES | NO | |
| revision | String? | YES | NO | |
| description | String? | YES | NO | |
| status | ProductStatus | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| productMaterials | ProductMaterial[] | NO | NO | |
| indents | Indent[] | NO | NO | |

## Table: ProductMaterial

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| productId | String | NO | NO | |
| materialId | String | NO | NO | |
| quantityRequired | Decimal | NO | NO | |
| scrapFactor | Decimal | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| product | Product | NO | YES | |
| material | Material | NO | YES | |

## Table: ManufacturingProcess

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| processName | String | NO | NO | |
| description | String? | YES | NO | |
| status | ProcessStatus | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| indentProcesses | IndentProcess[] | NO | NO | |
| processCosts | ProcessCost[] | NO | NO | |
| machineLogs | MachineLog[] | NO | NO | |

## Table: Indent

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| indentNumber | String | NO | NO | |
| productId | String | NO | NO | |
| departmentId | String | NO | NO | |
| priority | Priority | NO | NO | |
| status | IndentStatus | NO | NO | |
| currentState | String? | YES | NO | |
| currentStageId | String? | YES | NO | |
| customerName | String? | YES | NO | |
| layoutNumber | String? | YES | NO | |
| requiredDate | DateTime | NO | NO | |
| requiredDeliveryDate | DateTime? | YES | NO | |
| purpose | String? | YES | NO | |
| remarks | String? | YES | NO | |
| version | Int | NO | NO | |
| isLocked | Boolean | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String | NO | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| product | Product | NO | YES | |
| department | Department | NO | YES | |
| creator | User | NO | YES | |
| currentStage | WorkflowStage? | YES | YES | |
| indentItems | IndentItem[] | NO | NO | |
| broughtMaterials | IndentBroughtMaterial[] | NO | NO | |
| attachments | IndentAttachment[] | NO | NO | |
| costSheet | CostSheet? | YES | NO | |
| workflowHistory | WorkflowHistory[] | NO | NO | |
| additionalRequests | AdditionalMaterialRequest[] | NO | NO | |
| productionReceipt | ProductionReceipt? | YES | NO | |
| history | IndentHistory[] | NO | NO | |

## Table: IndentItem

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| indentId | String | NO | NO | |
| materialId | String | NO | NO | |
| quantity | Decimal | NO | NO | |
| issuedQuantity | Decimal | NO | NO | |
| unitId | String | NO | NO | |
| shape | String? | YES | NO | |
| diameterMm | Decimal? | YES | NO | |
| lengthMm | Decimal? | YES | NO | |
| widthMm | Decimal? | YES | NO | |
| heightMm | Decimal? | YES | NO | |
| unitWeightKg | Decimal? | YES | NO | |
| totalWeightKg | Decimal? | YES | NO | |
| remarks | String? | YES | NO | |
| status | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| indent | Indent | NO | YES | |
| material | Material | NO | YES | |
| unit | Unit | NO | YES | |
| indentProcesses | IndentProcess[] | NO | NO | |

## Table: IndentBroughtMaterial

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| indentId | String | NO | NO | |
| name | String | NO | NO | |
| quantity | Decimal | NO | NO | |
| issuedQuantity | Decimal | NO | NO | |
| status | String? | YES | NO | |
| specification | String? | YES | NO | |
| amount | Decimal? | YES | NO | |
| actualAmount | Decimal? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| indent | Indent | NO | YES | |

## Table: IndentAttachment

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| indentId | String | NO | NO | |
| fileName | String | NO | NO | |
| fileUrl | String | NO | NO | |
| fileType | FileType | NO | NO | |
| uploadedBy | String | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| indent | Indent | NO | YES | |
| uploader | User | NO | YES | |

## Table: IndentProcess

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| indentItemId | String | NO | NO | |
| processId | String | NO | NO | |
| sequence | Int | NO | NO | |
| estimatedHours | Decimal | NO | NO | |
| actualHours | Decimal? | YES | NO | |
| inputQuantity | Decimal? | YES | NO | |
| outputQuantity | Decimal? | YES | NO | |
| scrapQuantity | Decimal? | YES | NO | |
| status | ProcessStatus | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| indentItem | IndentItem | NO | YES | |
| process | ManufacturingProcess | NO | YES | |

## Table: CostSheet

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| costNumber | String | NO | NO | |
| indentId | String | NO | NO | |
| preparedBy | String | NO | NO | |
| designCost | Decimal | NO | NO | |
| overheadCost | Decimal | NO | NO | |
| contingencyCost | Decimal | NO | NO | |
| actualDesignCost | Decimal? | YES | NO | |
| actualOverheadCost | Decimal? | YES | NO | |
| actualContingencyCost | Decimal? | YES | NO | |
| predictedTotal | Decimal | NO | NO | |
| actualTotal | Decimal? | YES | NO | |
| varianceAmount | Decimal? | YES | NO | |
| variancePercentage | Decimal? | YES | NO | |
| status | CostSheetStatus | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String | NO | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| indent | Indent | NO | YES | |
| preparer | User | NO | YES | |
| costItems | CostItem[] | NO | NO | |
| processCosts | ProcessCost[] | NO | NO | |

## Table: CostItem

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| costSheetId | String | NO | NO | |
| materialId | String | NO | NO | |
| vendorId | String? | YES | NO | |
| predictedRate | Decimal | NO | NO | |
| predictedQuantity | Decimal | NO | NO | |
| predictedAmount | Decimal | NO | NO | |
| actualRate | Decimal? | YES | NO | |
| actualQuantity | Decimal? | YES | NO | |
| actualAmount | Decimal? | YES | NO | |
| remarks | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| costSheet | CostSheet | NO | YES | |
| material | Material | NO | YES | |
| vendor | Vendor? | YES | YES | |

## Table: ProcessCost

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| costSheetId | String | NO | NO | |
| processId | String | NO | NO | |
| predictedCost | Decimal | NO | NO | |
| actualCost | Decimal? | YES | NO | |
| variance | Decimal? | YES | NO | |
| estimatedHours | Decimal | NO | NO | |
| actualHours | Decimal? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| costSheet | CostSheet | NO | YES | |
| process | ManufacturingProcess | NO | YES | |

## Table: AdditionalMaterialRequest

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| parentIndentId | String | NO | NO | |
| requestNumber | String | NO | NO | |
| requestedBy | String | NO | NO | |
| approvedBy | String? | YES | NO | |
| reason | String | NO | NO | |
| status | AMRStatus | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String | NO | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| parentIndent | Indent | NO | YES | |
| requester | User | NO | YES | |
| approver | User? | YES | YES | |
| items | AdditionalMaterialItem[] | NO | NO | |

## Table: AdditionalMaterialItem

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| requestId | String | NO | NO | |
| materialId | String | NO | NO | |
| quantity | Decimal | NO | NO | |
| unitId | String | NO | NO | |
| remarks | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| request | AdditionalMaterialRequest | NO | YES | |
| material | Material | NO | YES | |
| unit | Unit | NO | YES | |

## Table: WorkflowStage

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| stageName | String | NO | NO | |
| sequence | Int | NO | NO | |
| description | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| workflowHistory | WorkflowHistory[] | NO | NO | |
| indents | Indent[] | NO | NO | |

## Table: WorkflowHistory

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| indentId | String | NO | NO | |
| fromDepartmentId | String? | YES | NO | |
| toDepartmentId | String | NO | NO | |
| stageId | String? | YES | NO | |
| movedBy | String | NO | NO | |
| movedAt | DateTime | NO | NO | |
| remarks | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| indent | Indent | NO | YES | |
| fromDepartment | Department? | YES | YES | |
| toDepartment | Department | NO | YES | |
| stage | WorkflowStage? | YES | YES | |
| mover | User | NO | YES | |

## Table: ProductionReceipt

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| indentId | String | NO | NO | |
| receivedBy | String | NO | NO | |
| receivedDate | DateTime | NO | NO | |
| remarks | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| indent | Indent | NO | YES | |
| receiver | User | NO | YES | |

## Table: IndentHistory

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| indentId | String | NO | NO | |
| version | Int | NO | NO | |
| snapshot | Json | NO | NO | |
| changedBy | String | NO | NO | |
| changedAt | DateTime | NO | NO | |
| changeNotes | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| indent | Indent | NO | YES | |
| changer | User | NO | YES | |

## Table: Notification

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| title | String | NO | NO | |
| message | String | NO | NO | |
| eventType | String? | YES | NO | |
| type | NotificationType | NO | NO | |
| priority | Priority | NO | NO | |
| referenceId | String? | YES | NO | |
| referenceModule | String? | YES | NO | |
| createdBy | String | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| creator | User | NO | YES | |
| recipients | NotificationRecipient[] | NO | NO | |

## Table: NotificationRecipient

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| notificationId | String | NO | NO | |
| userId | String | NO | NO | |
| isRead | Boolean | NO | NO | |
| readAt | DateTime? | YES | NO | |
| deliveryStatus | String | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| notification | Notification | NO | YES | |
| user | User | NO | YES | |

## Table: EmailLog

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| userId | String? | YES | NO | |
| to | String | NO | NO | |
| cc | String? | YES | NO | |
| bcc | String? | YES | NO | |
| subject | String | NO | NO | |
| body | String | NO | NO | |
| status | String | NO | NO | |
| errorMessage | String? | YES | NO | |
| sentAt | DateTime | NO | NO | |
| retryCount | Int | NO | NO | |
| messageId | String? | YES | NO | |
| durationMs | Int? | YES | NO | |
| user | User? | YES | YES | |

## Table: AuditLog

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| module | String | NO | NO | |
| recordId | String | NO | NO | |
| action | String | NO | NO | |
| oldValue | Json? | YES | NO | |
| newValue | Json? | YES | NO | |
| performedBy | String? | YES | NO | |
| ipAddress | String? | YES | NO | |
| browser | String? | YES | NO | |
| operatingSystem | String? | YES | NO | |
| device | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| user | User? | YES | YES | |

## Table: ActivityLog

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| userId | String | NO | NO | |
| activity | String | NO | NO | |
| module | String? | YES | NO | |
| description | String | NO | NO | |
| createdAt | DateTime | NO | NO | |
| user | User | NO | YES | |

## Table: Report

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| reportName | String | NO | NO | |
| reportType | String | NO | NO | |
| generatedBy | String | NO | NO | |
| fileUrl | String | NO | NO | |
| fileSize | BigInt | NO | NO | |
| generatedAt | DateTime | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| generator | User | NO | YES | |
| downloads | ReportDownload[] | NO | NO | |

## Table: ReportDownload

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| reportId | String | NO | NO | |
| downloadedBy | String | NO | NO | |
| downloadedAt | DateTime | NO | NO | |
| report | Report | NO | YES | |
| downloader | User | NO | YES | |

## Table: Machine

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| machineCode | String | NO | NO | |
| machineName | String | NO | NO | |
| status | ProcessStatus | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| machineLogs | MachineLog[] | NO | NO | |

## Table: MachineLog

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| machineId | String | NO | NO | |
| processId | String | NO | NO | |
| operatingHours | Decimal | NO | NO | |
| downtimeHours | Decimal | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| machine | Machine | NO | YES | |
| process | ManufacturingProcess | NO | YES | |

## Table: DepartmentBudget

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| departmentId | String | NO | NO | |
| fiscalYear | Int | NO | NO | |
| budgetAmount | Decimal | NO | NO | |
| allocatedAmount | Decimal | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| department | Department | NO | YES | |

## Table: UserSession

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| userId | String | NO | NO | |
| sessionToken | String | NO | NO | |
| refreshToken | String? | YES | NO | |
| ipAddress | String? | YES | NO | |
| browser | String? | YES | NO | |
| operatingSystem | String? | YES | NO | |
| device | String? | YES | NO | |
| country | String? | YES | NO | |
| city | String? | YES | NO | |
| status | SessionStatus | NO | NO | |
| loginAt | DateTime | NO | NO | |
| logoutAt | DateTime? | YES | NO | |
| lastActivity | DateTime? | YES | NO | |
| expiresAt | DateTime | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| user | User | NO | YES | |

## Table: RefreshToken

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| userId | String | NO | NO | |
| token | String | NO | NO | |
| expiresAt | DateTime | NO | NO | |
| revokedAt | DateTime? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| user | User | NO | YES | |

## Table: PasswordResetToken

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| userId | String | NO | NO | |
| token | String | NO | NO | |
| expiresAt | DateTime | NO | NO | |
| usedAt | DateTime? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| user | User | NO | YES | |

## Table: ApplicationSetting

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| key | String | NO | NO | |
| value | String | NO | NO | |
| category | String | NO | NO | |
| description | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |

## Table: FileUpload

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| fileName | String | NO | NO | |
| originalName | String | NO | NO | |
| extension | String | NO | NO | |
| mimeType | String | NO | NO | |
| size | BigInt | NO | NO | |
| storageProvider | String | NO | NO | |
| url | String | NO | NO | |
| uploadedBy | String | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| uploader | User | NO | YES | |

## Table: DashboardWidget

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| widgetCode | String | NO | NO | |
| widgetName | String | NO | NO | |
| icon | String? | YES | NO | |
| description | String? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| preferences | DashboardPreference[] | NO | NO | |

## Table: DashboardPreference

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| userId | String | NO | NO | |
| widgetId | String | NO | NO | |
| position | Int | NO | NO | |
| visible | Boolean | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| user | User | NO | YES | |
| widget | DashboardWidget | NO | YES | |

## Table: ScheduledJob

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| jobName | String | NO | NO | |
| cronExpression | String | NO | NO | |
| enabled | Boolean | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| history | JobExecutionHistory[] | NO | NO | |

## Table: JobExecutionHistory

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| jobId | String | NO | NO | |
| status | String | NO | NO | |
| startedAt | DateTime | NO | NO | |
| completedAt | DateTime? | YES | NO | |
| error | String? | YES | NO | |
| job | ScheduledJob | NO | YES | |

## Table: SLATracker

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| referenceId | String | NO | NO | |
| referenceModule | String | NO | NO | |
| startTime | DateTime | NO | NO | |
| endTime | DateTime? | YES | NO | |
| status | String | NO | NO | |
| breached | Boolean | NO | NO | |
| breachTime | DateTime? | YES | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |

## Table: Timeline

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| module | String | NO | NO | |
| recordId | String | NO | NO | |
| title | String | NO | NO | |
| description | String | NO | NO | |
| performedBy | String | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |
| isDeleted | Boolean | NO | NO | |
| deletedAt | DateTime? | YES | NO | |
| createdBy | String? | YES | NO | |
| updatedBy | String? | YES | NO | |
| deletedBy | String? | YES | NO | |
| performer | User | NO | YES | |

## Table: DocumentSequence

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| documentType | String | NO | NO | |
| year | Int | NO | NO | |
| nextNumber | Int | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |

## Table: EmailJob

| Column | Type | Nullable | Relation | Notes |
|---|---|---|---|---|
| id | String | NO | NO | |
| payload | Json | NO | NO | |
| status | EmailJobStatus | NO | NO | |
| attempts | Int | NO | NO | |
| maxAttempts | Int | NO | NO | |
| lastError | String? | YES | NO | |
| lockedAt | DateTime? | YES | NO | |
| lockedBy | String? | YES | NO | |
| priority | Int | NO | NO | |
| availableAt | DateTime | NO | NO | |
| createdAt | DateTime | NO | NO | |
| updatedAt | DateTime | NO | NO | |

