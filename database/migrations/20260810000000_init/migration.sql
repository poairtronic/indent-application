-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OBSOLETE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED', 'UNDER_DEVELOPMENT');

-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ALL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'INDENT_CREATED', 'INDENT_APPROVED', 'INDENT_REJECTED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "IndentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_STORES', 'PENDING_ACCOUNTS', 'PENDING_SENIOR_MANAGER', 'PENDING_GENERAL_MANAGER', 'APPROVED', 'REJECTED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CostSheetStatus" AS ENUM ('DRAFT', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AMRStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PDF', 'DRAWING', 'CAD', 'IMAGE', 'EXCEL', 'OTHER');

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "departmentCode" VARCHAR(50) NOT NULL,
    "departmentName" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "status" "DepartmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "roleName" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "code" VARCHAR(150) NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "employeeCode" VARCHAR(50) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "password" VARCHAR(255) NOT NULL,
    "departmentId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "profileImage" VARCHAR(255),
    "lastLogin" TIMESTAMPTZ(6),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMPTZ(6),
    "lockedUntil" TIMESTAMPTZ(6),
    "lastPasswordChange" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "vendorCode" VARCHAR(50) NOT NULL,
    "vendorName" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "gstNumber" VARCHAR(15),
    "panNumber" VARCHAR(10),
    "address" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "unitCode" VARCHAR(20) NOT NULL,
    "unitName" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "materialCode" VARCHAR(50) NOT NULL,
    "materialName" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "unitId" UUID NOT NULL,
    "minimumStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "maximumStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currentStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "category" VARCHAR(100) NOT NULL,
    "status" "MaterialStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_vendors" (
    "materialId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "leadTimeDays" INTEGER,
    "unitPrice" DECIMAL(18,4),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "material_vendors_pkey" PRIMARY KEY ("materialId","vendorId")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "productCode" VARCHAR(50) NOT NULL,
    "productName" VARCHAR(150) NOT NULL,
    "drawingNumber" VARCHAR(100),
    "revision" VARCHAR(20),
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_materials" (
    "productId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantityRequired" DECIMAL(18,4) NOT NULL,
    "scrapFactor" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "product_materials_pkey" PRIMARY KEY ("productId","materialId")
);

-- CreateTable
CREATE TABLE "manufacturing_processes" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "processCode" VARCHAR(50) NOT NULL,
    "processName" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "estimatedHours" DECIMAL(8,2) NOT NULL,
    "status" "ProcessStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "manufacturing_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indents" (
    "id" UUID NOT NULL,
    "indentNumber" VARCHAR(50) NOT NULL,
    "productId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "IndentStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStageId" UUID,
    "requiredDate" TIMESTAMPTZ(6) NOT NULL,
    "requiredDeliveryDate" TIMESTAMPTZ(6),
    "purpose" TEXT,
    "remarks" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "indents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indent_items" (
    "id" UUID NOT NULL,
    "indentId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitId" UUID NOT NULL,
    "remarks" TEXT,
    "status" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "indent_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indent_attachments" (
    "id" UUID NOT NULL,
    "indentId" UUID NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileUrl" VARCHAR(500) NOT NULL,
    "fileType" "FileType" NOT NULL DEFAULT 'OTHER',
    "uploadedBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "indent_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indent_processes" (
    "id" UUID NOT NULL,
    "indentItemId" UUID NOT NULL,
    "processId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "estimatedHours" DECIMAL(8,2) NOT NULL,
    "actualHours" DECIMAL(8,2),
    "status" "ProcessStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "indent_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_sheets" (
    "id" UUID NOT NULL,
    "costNumber" VARCHAR(50) NOT NULL,
    "indentId" UUID NOT NULL,
    "preparedBy" UUID NOT NULL,
    "predictedTotal" DECIMAL(18,4) NOT NULL,
    "actualTotal" DECIMAL(18,4),
    "varianceAmount" DECIMAL(18,4),
    "variancePercentage" DECIMAL(5,2),
    "status" "CostSheetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "cost_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_items" (
    "id" UUID NOT NULL,
    "costSheetId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "vendorId" UUID,
    "predictedRate" DECIMAL(18,4) NOT NULL,
    "predictedQuantity" DECIMAL(18,4) NOT NULL,
    "predictedAmount" DECIMAL(18,4) NOT NULL,
    "actualRate" DECIMAL(18,4),
    "actualQuantity" DECIMAL(18,4),
    "actualAmount" DECIMAL(18,4),
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "cost_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_costs" (
    "id" UUID NOT NULL,
    "costSheetId" UUID NOT NULL,
    "processId" UUID NOT NULL,
    "predictedCost" DECIMAL(18,4) NOT NULL,
    "actualCost" DECIMAL(18,4),
    "variance" DECIMAL(18,4),
    "estimatedHours" DECIMAL(8,2) NOT NULL,
    "actualHours" DECIMAL(8,2),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "process_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_material_requests" (
    "id" UUID NOT NULL,
    "parentIndentId" UUID NOT NULL,
    "requestNumber" VARCHAR(50) NOT NULL,
    "requestedBy" UUID NOT NULL,
    "approvedBy" UUID,
    "reason" TEXT NOT NULL,
    "status" "AMRStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "additional_material_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_material_items" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitId" UUID NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "additional_material_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_history" (
    "id" UUID NOT NULL,
    "indentId" UUID NOT NULL,
    "approvedBy" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "status" "IndentStatus" NOT NULL,
    "remarks" TEXT,
    "approvedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" UUID NOT NULL,
    "stageName" VARCHAR(100) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_history" (
    "id" UUID NOT NULL,
    "indentId" UUID NOT NULL,
    "fromDepartmentId" UUID,
    "toDepartmentId" UUID NOT NULL,
    "stageId" UUID,
    "movedBy" UUID NOT NULL,
    "movedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "workflow_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_receipts" (
    "id" UUID NOT NULL,
    "indentId" UUID NOT NULL,
    "receivedBy" UUID NOT NULL,
    "receivedDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "production_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indent_history" (
    "id" UUID NOT NULL,
    "indentId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" UUID NOT NULL,
    "changedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeNotes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "indent_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "referenceId" UUID,
    "referenceModule" VARCHAR(100),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_recipients" (
    "notificationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMPTZ(6),
    "deliveryStatus" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("notificationId","userId")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "to" VARCHAR(150) NOT NULL,
    "cc" TEXT,
    "bcc" TEXT,
    "subject" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "recordId" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "performedBy" UUID,
    "ipAddress" VARCHAR(45),
    "browser" VARCHAR(150),
    "operatingSystem" VARCHAR(100),
    "device" VARCHAR(100),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "activity" VARCHAR(100) NOT NULL,
    "module" VARCHAR(100),
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reportName" VARCHAR(150) NOT NULL,
    "reportType" VARCHAR(50) NOT NULL,
    "generatedBy" UUID NOT NULL,
    "fileUrl" VARCHAR(500) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "generatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_downloads" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "downloadedBy" UUID NOT NULL,
    "downloadedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionToken" VARCHAR(255) NOT NULL,
    "refreshToken" VARCHAR(255),
    "ipAddress" VARCHAR(45),
    "browser" VARCHAR(150),
    "operatingSystem" VARCHAR(100),
    "device" VARCHAR(100),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "loginAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" TIMESTAMPTZ(6),
    "lastActivity" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "application_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" UUID NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "extension" VARCHAR(20) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" BIGINT NOT NULL,
    "storageProvider" VARCHAR(50) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widgets" (
    "id" UUID NOT NULL,
    "widgetCode" VARCHAR(100) NOT NULL,
    "widgetName" VARCHAR(150) NOT NULL,
    "icon" VARCHAR(50),
    "description" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_preferences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "widgetId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "dashboard_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_jobs" (
    "id" UUID NOT NULL,
    "jobName" VARCHAR(150) NOT NULL,
    "cronExpression" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_execution_history" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),
    "error" TEXT,

    CONSTRAINT "job_execution_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_trackers" (
    "id" UUID NOT NULL,
    "referenceId" UUID NOT NULL,
    "referenceModule" VARCHAR(100) NOT NULL,
    "startTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMPTZ(6),
    "status" VARCHAR(50) NOT NULL,
    "breached" BOOLEAN NOT NULL DEFAULT false,
    "breachTime" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "sla_trackers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timelines" (
    "id" UUID NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "recordId" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedBy" UUID,

    CONSTRAINT "timelines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_departmentCode_key" ON "departments"("departmentCode");

-- CreateIndex
CREATE INDEX "departments_status_idx" ON "departments"("status");

-- CreateIndex
CREATE INDEX "departments_createdAt_idx" ON "departments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "roles_roleName_key" ON "roles"("roleName");

-- CreateIndex
CREATE INDEX "roles_createdAt_idx" ON "roles"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "permissions_code_idx" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_createdAt_idx" ON "permissions"("createdAt");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeCode_key" ON "users"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_vendorCode_key" ON "vendors"("vendorCode");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_email_key" ON "vendors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_gstNumber_key" ON "vendors"("gstNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_panNumber_key" ON "vendors"("panNumber");

-- CreateIndex
CREATE INDEX "vendors_status_idx" ON "vendors"("status");

-- CreateIndex
CREATE INDEX "vendors_createdAt_idx" ON "vendors"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "units_unitCode_key" ON "units"("unitCode");

-- CreateIndex
CREATE UNIQUE INDEX "materials_materialCode_key" ON "materials"("materialCode");

-- CreateIndex
CREATE INDEX "materials_unitId_idx" ON "materials"("unitId");

-- CreateIndex
CREATE INDEX "materials_status_idx" ON "materials"("status");

-- CreateIndex
CREATE INDEX "materials_createdAt_idx" ON "materials"("createdAt");

-- CreateIndex
CREATE INDEX "material_vendors_materialId_idx" ON "material_vendors"("materialId");

-- CreateIndex
CREATE INDEX "material_vendors_vendorId_idx" ON "material_vendors"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "products_productCode_key" ON "products"("productCode");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "product_materials_productId_idx" ON "product_materials"("productId");

-- CreateIndex
CREATE INDEX "product_materials_materialId_idx" ON "product_materials"("materialId");

-- CreateIndex
CREATE INDEX "manufacturing_processes_productId_idx" ON "manufacturing_processes"("productId");

-- CreateIndex
CREATE INDEX "manufacturing_processes_status_idx" ON "manufacturing_processes"("status");

-- CreateIndex
CREATE INDEX "manufacturing_processes_createdAt_idx" ON "manufacturing_processes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_processes_productId_processCode_key" ON "manufacturing_processes"("productId", "processCode");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_processes_productId_sequence_key" ON "manufacturing_processes"("productId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "indents_indentNumber_key" ON "indents"("indentNumber");

-- CreateIndex
CREATE INDEX "indents_indentNumber_idx" ON "indents"("indentNumber");

-- CreateIndex
CREATE INDEX "indents_productId_idx" ON "indents"("productId");

-- CreateIndex
CREATE INDEX "indents_departmentId_idx" ON "indents"("departmentId");

-- CreateIndex
CREATE INDEX "indents_createdBy_idx" ON "indents"("createdBy");

-- CreateIndex
CREATE INDEX "indents_status_idx" ON "indents"("status");

-- CreateIndex
CREATE INDEX "indents_currentStageId_idx" ON "indents"("currentStageId");

-- CreateIndex
CREATE INDEX "indents_requiredDate_idx" ON "indents"("requiredDate");

-- CreateIndex
CREATE INDEX "indents_createdAt_idx" ON "indents"("createdAt");

-- CreateIndex
CREATE INDEX "indent_items_indentId_idx" ON "indent_items"("indentId");

-- CreateIndex
CREATE INDEX "indent_items_materialId_idx" ON "indent_items"("materialId");

-- CreateIndex
CREATE INDEX "indent_items_unitId_idx" ON "indent_items"("unitId");

-- CreateIndex
CREATE INDEX "indent_items_isDeleted_idx" ON "indent_items"("isDeleted");

-- CreateIndex
CREATE INDEX "indent_items_createdAt_idx" ON "indent_items"("createdAt");

-- CreateIndex
CREATE INDEX "indent_attachments_indentId_idx" ON "indent_attachments"("indentId");

-- CreateIndex
CREATE INDEX "indent_attachments_uploadedBy_idx" ON "indent_attachments"("uploadedBy");

-- CreateIndex
CREATE INDEX "indent_attachments_isDeleted_idx" ON "indent_attachments"("isDeleted");

-- CreateIndex
CREATE INDEX "indent_attachments_createdAt_idx" ON "indent_attachments"("createdAt");

-- CreateIndex
CREATE INDEX "indent_processes_indentItemId_idx" ON "indent_processes"("indentItemId");

-- CreateIndex
CREATE INDEX "indent_processes_processId_idx" ON "indent_processes"("processId");

-- CreateIndex
CREATE INDEX "indent_processes_isDeleted_idx" ON "indent_processes"("isDeleted");

-- CreateIndex
CREATE INDEX "indent_processes_createdAt_idx" ON "indent_processes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "indent_processes_indentItemId_processId_key" ON "indent_processes"("indentItemId", "processId");

-- CreateIndex
CREATE UNIQUE INDEX "cost_sheets_costNumber_key" ON "cost_sheets"("costNumber");

-- CreateIndex
CREATE UNIQUE INDEX "cost_sheets_indentId_key" ON "cost_sheets"("indentId");

-- CreateIndex
CREATE INDEX "cost_sheets_costNumber_idx" ON "cost_sheets"("costNumber");

-- CreateIndex
CREATE INDEX "cost_sheets_indentId_idx" ON "cost_sheets"("indentId");

-- CreateIndex
CREATE INDEX "cost_sheets_status_idx" ON "cost_sheets"("status");

-- CreateIndex
CREATE INDEX "cost_sheets_createdAt_idx" ON "cost_sheets"("createdAt");

-- CreateIndex
CREATE INDEX "cost_items_costSheetId_idx" ON "cost_items"("costSheetId");

-- CreateIndex
CREATE INDEX "cost_items_materialId_idx" ON "cost_items"("materialId");

-- CreateIndex
CREATE INDEX "cost_items_vendorId_idx" ON "cost_items"("vendorId");

-- CreateIndex
CREATE INDEX "cost_items_isDeleted_idx" ON "cost_items"("isDeleted");

-- CreateIndex
CREATE INDEX "cost_items_createdAt_idx" ON "cost_items"("createdAt");

-- CreateIndex
CREATE INDEX "process_costs_costSheetId_idx" ON "process_costs"("costSheetId");

-- CreateIndex
CREATE INDEX "process_costs_processId_idx" ON "process_costs"("processId");

-- CreateIndex
CREATE INDEX "process_costs_isDeleted_idx" ON "process_costs"("isDeleted");

-- CreateIndex
CREATE INDEX "process_costs_createdAt_idx" ON "process_costs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "additional_material_requests_requestNumber_key" ON "additional_material_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "additional_material_requests_parentIndentId_idx" ON "additional_material_requests"("parentIndentId");

-- CreateIndex
CREATE INDEX "additional_material_requests_requestNumber_idx" ON "additional_material_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "additional_material_requests_status_idx" ON "additional_material_requests"("status");

-- CreateIndex
CREATE INDEX "additional_material_requests_createdAt_idx" ON "additional_material_requests"("createdAt");

-- CreateIndex
CREATE INDEX "additional_material_items_requestId_idx" ON "additional_material_items"("requestId");

-- CreateIndex
CREATE INDEX "additional_material_items_materialId_idx" ON "additional_material_items"("materialId");

-- CreateIndex
CREATE INDEX "additional_material_items_unitId_idx" ON "additional_material_items"("unitId");

-- CreateIndex
CREATE INDEX "additional_material_items_isDeleted_idx" ON "additional_material_items"("isDeleted");

-- CreateIndex
CREATE INDEX "additional_material_items_createdAt_idx" ON "additional_material_items"("createdAt");

-- CreateIndex
CREATE INDEX "approval_history_indentId_idx" ON "approval_history"("indentId");

-- CreateIndex
CREATE INDEX "approval_history_approvedBy_idx" ON "approval_history"("approvedBy");

-- CreateIndex
CREATE INDEX "approval_history_isDeleted_idx" ON "approval_history"("isDeleted");

-- CreateIndex
CREATE INDEX "approval_history_createdAt_idx" ON "approval_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_stageName_key" ON "workflow_stages"("stageName");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_sequence_key" ON "workflow_stages"("sequence");

-- CreateIndex
CREATE INDEX "workflow_stages_isDeleted_idx" ON "workflow_stages"("isDeleted");

-- CreateIndex
CREATE INDEX "workflow_stages_createdAt_idx" ON "workflow_stages"("createdAt");

-- CreateIndex
CREATE INDEX "workflow_history_indentId_idx" ON "workflow_history"("indentId");

-- CreateIndex
CREATE INDEX "workflow_history_stageId_idx" ON "workflow_history"("stageId");

-- CreateIndex
CREATE INDEX "workflow_history_fromDepartmentId_idx" ON "workflow_history"("fromDepartmentId");

-- CreateIndex
CREATE INDEX "workflow_history_toDepartmentId_idx" ON "workflow_history"("toDepartmentId");

-- CreateIndex
CREATE INDEX "workflow_history_movedBy_idx" ON "workflow_history"("movedBy");

-- CreateIndex
CREATE INDEX "workflow_history_movedAt_idx" ON "workflow_history"("movedAt");

-- CreateIndex
CREATE INDEX "workflow_history_isDeleted_idx" ON "workflow_history"("isDeleted");

-- CreateIndex
CREATE INDEX "workflow_history_createdAt_idx" ON "workflow_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "production_receipts_indentId_key" ON "production_receipts"("indentId");

-- CreateIndex
CREATE INDEX "production_receipts_indentId_idx" ON "production_receipts"("indentId");

-- CreateIndex
CREATE INDEX "production_receipts_isDeleted_idx" ON "production_receipts"("isDeleted");

-- CreateIndex
CREATE INDEX "production_receipts_createdAt_idx" ON "production_receipts"("createdAt");

-- CreateIndex
CREATE INDEX "indent_history_indentId_idx" ON "indent_history"("indentId");

-- CreateIndex
CREATE INDEX "indent_history_changedAt_idx" ON "indent_history"("changedAt");

-- CreateIndex
CREATE INDEX "indent_history_isDeleted_idx" ON "indent_history"("isDeleted");

-- CreateIndex
CREATE INDEX "indent_history_createdAt_idx" ON "indent_history"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_createdBy_idx" ON "notifications"("createdBy");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_isDeleted_idx" ON "notifications"("isDeleted");

-- CreateIndex
CREATE INDEX "notification_recipients_notificationId_idx" ON "notification_recipients"("notificationId");

-- CreateIndex
CREATE INDEX "notification_recipients_userId_idx" ON "notification_recipients"("userId");

-- CreateIndex
CREATE INDEX "notification_recipients_isRead_idx" ON "notification_recipients"("isRead");

-- CreateIndex
CREATE INDEX "notification_recipients_isDeleted_idx" ON "notification_recipients"("isDeleted");

-- CreateIndex
CREATE INDEX "email_logs_userId_idx" ON "email_logs"("userId");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_recordId_idx" ON "audit_logs"("recordId");

-- CreateIndex
CREATE INDEX "audit_logs_performedBy_idx" ON "audit_logs"("performedBy");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_activity_idx" ON "activity_logs"("activity");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "reports_generatedBy_idx" ON "reports"("generatedBy");

-- CreateIndex
CREATE INDEX "reports_generatedAt_idx" ON "reports"("generatedAt");

-- CreateIndex
CREATE INDEX "reports_isDeleted_idx" ON "reports"("isDeleted");

-- CreateIndex
CREATE INDEX "report_downloads_reportId_idx" ON "report_downloads"("reportId");

-- CreateIndex
CREATE INDEX "report_downloads_downloadedBy_idx" ON "report_downloads"("downloadedBy");

-- CreateIndex
CREATE INDEX "report_downloads_downloadedAt_idx" ON "report_downloads"("downloadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON "user_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refreshToken_key" ON "user_sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_sessionToken_idx" ON "user_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "user_sessions_isDeleted_idx" ON "user_sessions"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_isDeleted_idx" ON "refresh_tokens"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_isDeleted_idx" ON "password_reset_tokens"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "application_settings_key_key" ON "application_settings"("key");

-- CreateIndex
CREATE INDEX "application_settings_key_idx" ON "application_settings"("key");

-- CreateIndex
CREATE INDEX "application_settings_category_idx" ON "application_settings"("category");

-- CreateIndex
CREATE INDEX "application_settings_isDeleted_idx" ON "application_settings"("isDeleted");

-- CreateIndex
CREATE INDEX "file_uploads_uploadedBy_idx" ON "file_uploads"("uploadedBy");

-- CreateIndex
CREATE INDEX "file_uploads_extension_idx" ON "file_uploads"("extension");

-- CreateIndex
CREATE INDEX "file_uploads_isDeleted_idx" ON "file_uploads"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_widgets_widgetCode_key" ON "dashboard_widgets"("widgetCode");

-- CreateIndex
CREATE INDEX "dashboard_widgets_widgetCode_idx" ON "dashboard_widgets"("widgetCode");

-- CreateIndex
CREATE INDEX "dashboard_widgets_isDeleted_idx" ON "dashboard_widgets"("isDeleted");

-- CreateIndex
CREATE INDEX "dashboard_preferences_userId_idx" ON "dashboard_preferences"("userId");

-- CreateIndex
CREATE INDEX "dashboard_preferences_widgetId_idx" ON "dashboard_preferences"("widgetId");

-- CreateIndex
CREATE INDEX "dashboard_preferences_isDeleted_idx" ON "dashboard_preferences"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_preferences_userId_widgetId_key" ON "dashboard_preferences"("userId", "widgetId");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_jobs_jobName_key" ON "scheduled_jobs"("jobName");

-- CreateIndex
CREATE INDEX "scheduled_jobs_jobName_idx" ON "scheduled_jobs"("jobName");

-- CreateIndex
CREATE INDEX "scheduled_jobs_isDeleted_idx" ON "scheduled_jobs"("isDeleted");

-- CreateIndex
CREATE INDEX "job_execution_history_jobId_idx" ON "job_execution_history"("jobId");

-- CreateIndex
CREATE INDEX "job_execution_history_status_idx" ON "job_execution_history"("status");

-- CreateIndex
CREATE INDEX "job_execution_history_startedAt_idx" ON "job_execution_history"("startedAt");

-- CreateIndex
CREATE INDEX "sla_trackers_referenceId_idx" ON "sla_trackers"("referenceId");

-- CreateIndex
CREATE INDEX "sla_trackers_referenceModule_idx" ON "sla_trackers"("referenceModule");

-- CreateIndex
CREATE INDEX "sla_trackers_status_idx" ON "sla_trackers"("status");

-- CreateIndex
CREATE INDEX "sla_trackers_isDeleted_idx" ON "sla_trackers"("isDeleted");

-- CreateIndex
CREATE INDEX "timelines_recordId_idx" ON "timelines"("recordId");

-- CreateIndex
CREATE INDEX "timelines_module_idx" ON "timelines"("module");

-- CreateIndex
CREATE INDEX "timelines_performedBy_idx" ON "timelines"("performedBy");

-- CreateIndex
CREATE INDEX "timelines_createdAt_idx" ON "timelines"("createdAt");

-- CreateIndex
CREATE INDEX "timelines_isDeleted_idx" ON "timelines"("isDeleted");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_vendors" ADD CONSTRAINT "material_vendors_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_vendors" ADD CONSTRAINT "material_vendors_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_materials" ADD CONSTRAINT "product_materials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_materials" ADD CONSTRAINT "product_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_processes" ADD CONSTRAINT "manufacturing_processes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indents" ADD CONSTRAINT "indents_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indents" ADD CONSTRAINT "indents_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indents" ADD CONSTRAINT "indents_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indents" ADD CONSTRAINT "indents_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indent_items" ADD CONSTRAINT "indent_items_indentId_fkey" FOREIGN KEY ("indentId") REFERENCES "indents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indent_items" ADD CONSTRAINT "indent_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indent_items" ADD CONSTRAINT "indent_items_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indent_attachments" ADD CONSTRAINT "indent_attachments_indentId_fkey" FOREIGN KEY ("indentId") REFERENCES "indents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indent_attachments" ADD CONSTRAINT "indent_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indent_processes" ADD CONSTRAINT "indent_processes_indentItemId_fkey" FOREIGN KEY ("indentItemId") REFERENCES "indent_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indent_processes" ADD CONSTRAINT "indent_processes_processId_fkey" FOREIGN KEY ("processId") REFERENCES "manufacturing_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_sheets" ADD CONSTRAINT "cost_sheets_indentId_fkey" FOREIGN KEY ("indentId") REFERENCES "indents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_sheets" ADD CONSTRAINT "cost_sheets_preparedBy_fkey" FOREIGN KEY ("preparedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_items" ADD CONSTRAINT "cost_items_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "cost_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_items" ADD CONSTRAINT "cost_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_items" ADD CONSTRAINT "cost_items_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_costs" ADD CONSTRAINT "process_costs_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "cost_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_costs" ADD CONSTRAINT "process_costs_processId_fkey" FOREIGN KEY ("processId") REFERENCES "manufacturing_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_material_requests" ADD CONSTRAINT "additional_material_requests_parentIndentId_fkey" FOREIGN KEY ("parentIndentId") REFERENCES "indents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_material_requests" ADD CONSTRAINT "additional_material_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_material_requests" ADD CONSTRAINT "additional_material_requests_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_material_items" ADD CONSTRAINT "additional_material_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "additional_material_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_material_items" ADD CONSTRAINT "additional_material_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_material_items" ADD CONSTRAINT "additional_material_items_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_indentId_fkey" FOREIGN KEY ("indentId") REFERENCES "indents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_indentId_fkey" FOREIGN KEY ("indentId") REFERENCES "indents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_movedBy_fkey" FOREIGN KEY ("movedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_receipts" ADD CONSTRAINT "production_receipts_indentId_fkey" FOREIGN KEY ("indentId") REFERENCES "indents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_receipts" ADD CONSTRAINT "production_receipts_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indent_history" ADD CONSTRAINT "indent_history_indentId_fkey" FOREIGN KEY ("indentId") REFERENCES "indents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indent_history" ADD CONSTRAINT "indent_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_downloads" ADD CONSTRAINT "report_downloads_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_downloads" ADD CONSTRAINT "report_downloads_downloadedBy_fkey" FOREIGN KEY ("downloadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_preferences" ADD CONSTRAINT "dashboard_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_preferences" ADD CONSTRAINT "dashboard_preferences_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "dashboard_widgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_execution_history" ADD CONSTRAINT "job_execution_history_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "scheduled_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelines" ADD CONSTRAINT "timelines_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

