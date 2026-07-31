# ENTERPRISE MANUFACTURING INDENT & COSTING MANAGEMENT SYSTEM (IMCMS)

## Overview

The **Enterprise Manufacturing Indent & Costing Management System (IMCMS)** is a web-based ERP module designed to digitize and automate engineering indent creation, process costing, material fulfillment, manufacturing execution, financial actual cost verification, and transaction archival.

The platform operates on a **Two-Loop Business Workflow Architecture**:
- **Loop 1 (Manufacturing Workflow):** Design Indent & Process Cost Sheet Submission → Stores Material Verification & Issue → Production Manufacturing & Customer Delivery.
- **Loop 2 (Financial Workflow):** Accounts Actual Cost Verification & Cost Variance Calculation → System Archival & Business Transaction Closure.

### Zero-Approval Architecture
Senior Managers and General Managers do NOT perform manual approvals or rejections. Instead, they receive real-time automated notifications at every stage transition and monitor operations passively via executive dashboards.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Query, Axios
- **Backend:** NestJS, TypeScript, Prisma ORM, JWT, bcrypt
- **Database:** Neon PostgreSQL

---

## Repository Structure

- `frontend/` - React SPA frontend codebase
- `backend/` - NestJS REST API backend codebase
- `database/` - Prisma schemas, migrations, seeds, and backups
- `docs/` - System documentation (PRD, TRD, Application Flow, Backend Domain Schema, Architecture)
- `scripts/` - Automation and utility scripts

---

## Getting Started

### Backend Setup
```bash
cd backend
npm install
# Configure environment variables in backend/.env
npx prisma migrate dev
npm run start:dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
