# Project Agent Rules & Requirements

## Core Product & Technical Specification Documents
The authoritative specifications for the Enterprise Manufacturing Indent & Costing Management System (IMCMS) are defined in:
- **Product Requirements Document (PRD):** [PRD.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/PRD.md) | [docs/PRD.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/docs/PRD.md)
- **Technical Requirements Document (TRD):** [TRD.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/TRD.md) | [docs/TRD.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/docs/TRD.md)
- **Application Flow Specification:** [APPLICATION_FLOW.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/APPLICATION_FLOW.md) | [docs/APPLICATION_FLOW.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/docs/APPLICATION_FLOW.md)
- **Backend Domain Schema & AI Rules:** [BACKEND_DOMAIN_SCHEMA.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/BACKEND_DOMAIN_SCHEMA.md) | [docs/BACKEND_DOMAIN_SCHEMA.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/docs/BACKEND_DOMAIN_SCHEMA.md)
- **UI/UX Refactoring & Design System:** [UI_UX_SPECIFICATION.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/UI_UX_SPECIFICATION.md) | [docs/UI_UX_SPECIFICATION.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/docs/UI_UX_SPECIFICATION.md)
- **Master Implementation Roadmap:** [IMPLEMENTATION_ROADMAP.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/IMPLEMENTATION_ROADMAP.md) | [docs/IMPLEMENTATION_ROADMAP.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/docs/IMPLEMENTATION_ROADMAP.md)
- **Software Implementation Audit Report:** [SOFTWARE_IMPLEMENTATION_REPORT.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/SOFTWARE_IMPLEMENTATION_REPORT.md) | [docs/SOFTWARE_IMPLEMENTATION_REPORT.md](file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/docs/SOFTWARE_IMPLEMENTATION_REPORT.md)

### CRITICAL HARD BOUNDARIES & RULES FOR AI AGENTS:
1. **Current Development Milestone:**  
   Phase 1–8C is **100% COMPLETE** and **IMMUTABLE**. Never modify or regenerate core auth, RBAC guards, security dashboards, NestJS structure, or Prisma schemas created in Phase 1–8C.
2. **Incremental Phase-by-Phase Execution:**  
   All future development must be driven **one phase at a time** (e.g. Phase 9 → Phase 10 → Phase 11). Never attempt to rewrite or build the full application in a single step.
3. **Presentation-Layer Refactor Scope (Phase 10):**  
   UI refactoring must be presentation-only, consuming theme variables (`src/theme/`) and reusable components (`src/components/`).
4. **Business Workflow Sequence (Two-Loop Zero-Approval Architecture):**  
   - **Loop 1 (Manufacturing Workflow):** `Draft` → `Design Completed` → `Stores Processing` → `Production Processing` → `Customer Delivered`
   - **Loop 2 (Financial Workflow):** `Accounts Cost Verification` → `Accounts Financial Closure` → `Archived` → `Completed`
   - *Zero-Approval Rule:* Senior Managers & General Managers do NOT approve transactions; they are notified at each stage and passively monitor progress via executive dashboards.
5. **Technology Stack:**  
   - Frontend: React, TypeScript, Vite, Tailwind CSS, Zustand, React Query
   - Backend: NestJS, TypeScript, Prisma ORM, JWT, bcrypt
   - Database: Neon PostgreSQL
