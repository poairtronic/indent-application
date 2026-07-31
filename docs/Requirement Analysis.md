# Requirement Analysis

## 1. Project Overview
This project is the Enterprise Manufacturing Indent & Costing Management System (IMCMS), designed to streamline engineering Indent Sheets, Process Cost Sheets, raw material fulfillment, manufacturing execution, financial actual cost verification, and automated transaction archival.

## 2. Core Business Objectives
- Digitize Indent Sheets and Process Cost Sheets.
- Operate on a Two-Loop Business Workflow (Loop 1: Manufacturing, Loop 2: Financial Closure & Archival).
- Eliminate manual approval bottlenecks via a Zero-Approval Executive Notification Model.
- Calculate Cost Variance per manufacturing process (Planned vs Actual).
- Provide real-time executive monitoring dashboards for Senior Managers and General Managers.

## 3. Scope & System Boundaries
- **Users & Roles:** Design, Stores, Production, Accounts, Senior Manager, General Manager, System Admin.
- **Workflow State Machine:** `Draft` → `Design Completed` → `Stores Processing` → `Production Processing` → `Customer Delivered` → `Accounts Cost Verification` → `Accounts Financial Closure` → `Archived` → `Completed`.
- **Notifications & Archival:** Automated in-app/email alerts on state transitions and automated system archival of closed transactions.
