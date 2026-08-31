# ER DIAGRAM

```mermaid
erDiagram
  Department ||--o{ WorkflowHistory : "workflowFrom"
  Department ||--o{ WorkflowHistory : "workflowTo"
  Department {
    String id
    String departmentCode
    String departmentName
    String description
    DepartmentStatus status
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    User users
    Indent indents
    DepartmentBudget departmentBudgets
  }

  Role {
    String id
    String roleName
    String description
    Boolean isSystem
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    User users
    RolePermission rolePermissions
  }

  Permission {
    String id
    String module
    PermissionAction action
    String code
    String description
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    RolePermission rolePermissions
  }

  RolePermission }o--|| Role : "role"
  RolePermission }o--|| Permission : "permission"
  RolePermission {
    String roleId
    String permissionId
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  User }o--|| Department : "department"
  User }o--|| Role : "role"
  User ||--o{ Indent : "indentsCreated"
  User ||--o{ CostSheet : "costSheetsPrepared"
  User ||--o{ AdditionalMaterialRequest : "amrRequested"
  User ||--o{ AdditionalMaterialRequest : "amrApproved"
  User ||--o{ Notification : "notificationsCreated"
  User {
    String id
    String employeeCode
    String firstName
    String lastName
    String email
    String phone
    String password
    String departmentId
    String roleId
    UserStatus status
    String profileImage
    DateTime lastLogin
    Int failedLoginAttempts
    DateTime lockedAt
    DateTime lockedUntil
    DateTime lastPasswordChange
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    IndentAttachment attachmentsUploaded
    WorkflowHistory workflowMoves
    ProductionReceipt productionReceipts
    IndentHistory indentChanges
    NotificationRecipient notificationRecipients
    EmailLog emailLogs
    AuditLog auditLogs
    ActivityLog activityLogs
    Report reportsGenerated
    ReportDownload reportDownloads
    UserSession sessions
    RefreshToken refreshTokens
    PasswordResetToken passwordResetTokens
    FileUpload fileUploads
    DashboardPreference dashboardPreferences
    Timeline timelineActivities
  }

  Vendor {
    String id
    String vendorCode
    String vendorName
    String email
    String phone
    String gstNumber
    String panNumber
    String address
    String city
    String state
    String country
    String pincode
    VendorStatus status
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    MaterialVendor materialVendors
    CostItem costItems
  }

  Unit {
    String id
    String unitCode
    String unitName
    String symbol
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    Material materials
    IndentItem indentItems
    AdditionalMaterialItem amrItems
  }

  Material }o--|| Unit : "unit"
  Material {
    String id
    String materialCode
    String materialName
    String description
    String unitId
    Decimal minimumStock
    Decimal maximumStock
    Decimal currentStock
    String category
    Decimal densityKgPerDm3
    MaterialStatus status
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    MaterialVendor materialVendors
    ProductMaterial productMaterials
    IndentItem indentItems
    CostItem costItems
    AdditionalMaterialItem amrItems
  }

  MaterialVendor }o--|| Material : "material"
  MaterialVendor }o--|| Vendor : "vendor"
  MaterialVendor {
    String materialId
    String vendorId
    Int leadTimeDays
    Decimal unitPrice
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  Product {
    String id
    String productCode
    String productName
    String drawingNumber
    String revision
    String description
    ProductStatus status
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    ProductMaterial productMaterials
    Indent indents
  }

  ProductMaterial }o--|| Product : "product"
  ProductMaterial }o--|| Material : "material"
  ProductMaterial {
    String productId
    String materialId
    Decimal quantityRequired
    Decimal scrapFactor
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  ManufacturingProcess {
    String id
    String processName
    String description
    ProcessStatus status
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    IndentProcess indentProcesses
    ProcessCost processCosts
    MachineLog machineLogs
  }

  Indent }o--|| Product : "product"
  Indent }o--|| Department : "department"
  Indent }o--|| User : "creator"
  Indent }o--|| WorkflowStage : "currentStage"
  Indent {
    String id
    String indentNumber
    String productId
    String departmentId
    Priority priority
    IndentStatus status
    String currentState
    String currentStageId
    String customerName
    String layoutNumber
    DateTime requiredDate
    DateTime requiredDeliveryDate
    String purpose
    String remarks
    Int version
    Boolean isLocked
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    IndentItem indentItems
    IndentBroughtMaterial broughtMaterials
    IndentAttachment attachments
    CostSheet costSheet
    WorkflowHistory workflowHistory
    AdditionalMaterialRequest additionalRequests
    ProductionReceipt productionReceipt
    IndentHistory history
  }

  IndentItem }o--|| Indent : "indent"
  IndentItem }o--|| Material : "material"
  IndentItem }o--|| Unit : "unit"
  IndentItem {
    String id
    String indentId
    String materialId
    Decimal quantity
    Decimal issuedQuantity
    String unitId
    String shape
    Decimal diameterMm
    Decimal lengthMm
    Decimal widthMm
    Decimal heightMm
    Decimal unitWeightKg
    Decimal totalWeightKg
    String remarks
    String status
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    IndentProcess indentProcesses
  }

  IndentBroughtMaterial }o--|| Indent : "indent"
  IndentBroughtMaterial {
    String id
    String indentId
    String name
    Decimal quantity
    Decimal issuedQuantity
    String status
    String specification
    Decimal amount
    Decimal actualAmount
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  IndentAttachment }o--|| Indent : "indent"
  IndentAttachment }o--|| User : "uploader"
  IndentAttachment {
    String id
    String indentId
    String fileName
    String fileUrl
    FileType fileType
    String uploadedBy
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  IndentProcess }o--|| IndentItem : "indentItem"
  IndentProcess }o--|| ManufacturingProcess : "process"
  IndentProcess {
    String id
    String indentItemId
    String processId
    Int sequence
    Decimal estimatedHours
    Decimal actualHours
    Decimal inputQuantity
    Decimal outputQuantity
    Decimal scrapQuantity
    ProcessStatus status
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  CostSheet }o--|| Indent : "indent"
  CostSheet }o--|| User : "preparer"
  CostSheet {
    String id
    String costNumber
    String indentId
    String preparedBy
    Decimal designCost
    Decimal overheadCost
    Decimal contingencyCost
    Decimal actualDesignCost
    Decimal actualOverheadCost
    Decimal actualContingencyCost
    Decimal predictedTotal
    Decimal actualTotal
    Decimal varianceAmount
    Decimal variancePercentage
    CostSheetStatus status
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    CostItem costItems
    ProcessCost processCosts
  }

  CostItem }o--|| CostSheet : "costSheet"
  CostItem }o--|| Material : "material"
  CostItem }o--|| Vendor : "vendor"
  CostItem {
    String id
    String costSheetId
    String materialId
    String vendorId
    Decimal predictedRate
    Decimal predictedQuantity
    Decimal predictedAmount
    Decimal actualRate
    Decimal actualQuantity
    Decimal actualAmount
    String remarks
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  ProcessCost }o--|| CostSheet : "costSheet"
  ProcessCost }o--|| ManufacturingProcess : "process"
  ProcessCost {
    String id
    String costSheetId
    String processId
    Decimal predictedCost
    Decimal actualCost
    Decimal variance
    Decimal estimatedHours
    Decimal actualHours
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  AdditionalMaterialRequest }o--|| Indent : "parentIndent"
  AdditionalMaterialRequest }o--|| User : "requester"
  AdditionalMaterialRequest }o--|| User : "approver"
  AdditionalMaterialRequest {
    String id
    String parentIndentId
    String requestNumber
    String requestedBy
    String approvedBy
    String reason
    AMRStatus status
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    AdditionalMaterialItem items
  }

  AdditionalMaterialItem }o--|| AdditionalMaterialRequest : "request"
  AdditionalMaterialItem }o--|| Material : "material"
  AdditionalMaterialItem }o--|| Unit : "unit"
  AdditionalMaterialItem {
    String id
    String requestId
    String materialId
    Decimal quantity
    String unitId
    String remarks
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  WorkflowStage {
    String id
    String stageName
    Int sequence
    String description
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    WorkflowHistory workflowHistory
    Indent indents
  }

  WorkflowHistory }o--|| Indent : "indent"
  WorkflowHistory }o--|| Department : "fromDepartment"
  WorkflowHistory }o--|| Department : "toDepartment"
  WorkflowHistory }o--|| WorkflowStage : "stage"
  WorkflowHistory }o--|| User : "mover"
  WorkflowHistory {
    String id
    String indentId
    String fromDepartmentId
    String toDepartmentId
    String stageId
    String movedBy
    DateTime movedAt
    String remarks
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  ProductionReceipt }o--|| Indent : "indent"
  ProductionReceipt }o--|| User : "receiver"
  ProductionReceipt {
    String id
    String indentId
    String receivedBy
    DateTime receivedDate
    String remarks
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  IndentHistory }o--|| Indent : "indent"
  IndentHistory }o--|| User : "changer"
  IndentHistory {
    String id
    String indentId
    Int version
    Json snapshot
    String changedBy
    DateTime changedAt
    String changeNotes
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  Notification }o--|| User : "creator"
  Notification {
    String id
    String title
    String message
    String eventType
    NotificationType type
    Priority priority
    String referenceId
    String referenceModule
    String createdBy
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String updatedBy
    String deletedBy
    NotificationRecipient recipients
  }

  NotificationRecipient }o--|| Notification : "notification"
  NotificationRecipient }o--|| User : "user"
  NotificationRecipient {
    String notificationId
    String userId
    Boolean isRead
    DateTime readAt
    String deliveryStatus
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  EmailLog }o--|| User : "user"
  EmailLog {
    String id
    String userId
    String to
    String cc
    String bcc
    String subject
    String body
    String status
    String errorMessage
    DateTime sentAt
    Int retryCount
    String messageId
    Int durationMs
  }

  AuditLog }o--|| User : "user"
  AuditLog {
    String id
    String module
    String recordId
    String action
    Json oldValue
    Json newValue
    String performedBy
    String ipAddress
    String browser
    String operatingSystem
    String device
    DateTime createdAt
  }

  ActivityLog }o--|| User : "user"
  ActivityLog {
    String id
    String userId
    String activity
    String module
    String description
    DateTime createdAt
  }

  Report }o--|| User : "generator"
  Report {
    String id
    String reportName
    String reportType
    String generatedBy
    String fileUrl
    BigInt fileSize
    DateTime generatedAt
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    ReportDownload downloads
  }

  ReportDownload }o--|| Report : "report"
  ReportDownload }o--|| User : "downloader"
  ReportDownload {
    String id
    String reportId
    String downloadedBy
    DateTime downloadedAt
  }

  Machine {
    String id
    String machineCode
    String machineName
    ProcessStatus status
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    MachineLog machineLogs
  }

  MachineLog }o--|| Machine : "machine"
  MachineLog }o--|| ManufacturingProcess : "process"
  MachineLog {
    String id
    String machineId
    String processId
    Decimal operatingHours
    Decimal downtimeHours
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  DepartmentBudget }o--|| Department : "department"
  DepartmentBudget {
    String id
    String departmentId
    Int fiscalYear
    Decimal budgetAmount
    Decimal allocatedAmount
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  UserSession }o--|| User : "user"
  UserSession {
    String id
    String userId
    String sessionToken
    String refreshToken
    String ipAddress
    String browser
    String operatingSystem
    String device
    String country
    String city
    SessionStatus status
    DateTime loginAt
    DateTime logoutAt
    DateTime lastActivity
    DateTime expiresAt
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  RefreshToken }o--|| User : "user"
  RefreshToken {
    String id
    String userId
    String token
    DateTime expiresAt
    DateTime revokedAt
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  PasswordResetToken }o--|| User : "user"
  PasswordResetToken {
    String id
    String userId
    String token
    DateTime expiresAt
    DateTime usedAt
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  ApplicationSetting {
    String id
    String key
    String value
    String category
    String description
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  FileUpload }o--|| User : "uploader"
  FileUpload {
    String id
    String fileName
    String originalName
    String extension
    String mimeType
    BigInt size
    String storageProvider
    String url
    String uploadedBy
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  DashboardWidget {
    String id
    String widgetCode
    String widgetName
    String icon
    String description
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    DashboardPreference preferences
  }

  DashboardPreference }o--|| User : "user"
  DashboardPreference }o--|| DashboardWidget : "widget"
  DashboardPreference {
    String id
    String userId
    String widgetId
    Int position
    Boolean visible
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  ScheduledJob {
    String id
    String jobName
    String cronExpression
    Boolean enabled
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
    JobExecutionHistory history
  }

  JobExecutionHistory }o--|| ScheduledJob : "job"
  JobExecutionHistory {
    String id
    String jobId
    String status
    DateTime startedAt
    DateTime completedAt
    String error
  }

  SLATracker {
    String id
    String referenceId
    String referenceModule
    DateTime startTime
    DateTime endTime
    String status
    Boolean breached
    DateTime breachTime
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  Timeline }o--|| User : "performer"
  Timeline {
    String id
    String module
    String recordId
    String title
    String description
    String performedBy
    DateTime createdAt
    DateTime updatedAt
    Boolean isDeleted
    DateTime deletedAt
    String createdBy
    String updatedBy
    String deletedBy
  }

  DocumentSequence {
    String id
    String documentType
    Int year
    Int nextNumber
    DateTime createdAt
    DateTime updatedAt
  }

  EmailJob {
    String id
    Json payload
    EmailJobStatus status
    Int attempts
    Int maxAttempts
    String lastError
    DateTime lockedAt
    String lockedBy
    Int priority
    DateTime availableAt
    DateTime createdAt
    DateTime updatedAt
  }

```
