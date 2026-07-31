# Software Requirements Specification (SRS)

## 1. Introduction
This SRS document describes the system requirements for the Enterprise Manufacturing Indent & Costing Management System (IMCMS).

## 2. Functional Requirements
- **FR1: Authentication & Authorization**: Users log in securely with JWT token rotation and role/stage-based access controls.
- **FR2: Indent & Process Cost Sheet Creation**: Design creates Indent Sheets (product, materials, drawings) and Process Cost Sheets (manufacturing processes, vendor/in-house selection, planned process costs).
- **FR3: Two-Loop Business Workflow Architecture**:
  - **Loop 1 (Manufacturing Workflow):** Design submission → Stores stock verification & material issue → Production manufacturing execution & customer delivery.
  - **Loop 2 (Financial Workflow):** Accounts vendor/in-house invoice collection, actual process cost entry, cost variance calculation → System automated archival & business transaction closure.
- **FR4: Zero-Approval Executive Notification Engine**: Automated real-time in-app and email notifications to Senior Managers & General Managers at every state transition for passive monitoring and oversight.
- **FR5: Vendor & Master Data Management**: Maintain master catalogs for Products, Materials, Vendors, Manufacturing Processes, and Units.

## 3. Non-Functional Requirements
- **Security**: Password hashing using bcrypt, HTTPS protocols, JWT authentication, and session revocation.
- **Performance**: Sub-2-second API response times under enterprise loads.
- **Usability**: Responsive, intuitive enterprise dark-themed dashboard UI compliant with WCAG 2.1 AA.
