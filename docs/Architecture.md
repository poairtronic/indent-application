# System Architecture

## Architecture Overview
The system follows an **Enterprise Modular Monolith Architecture** decoupled via REST APIs.

```
       +-------------------+
       |    React Client   |
       +---------+---------+
                 | (REST API / JWT)
                 v
       +-------------------+
       |     NestJS API    |
       +---------+---------+
                 | (Prisma ORM)
                 v
       +-------------------+
       | Neon PostgreSQL   |
       +-------------------+
```

## Two-Loop Business Workflow & Zero-Approval Engine
- **Loop 1 (Manufacturing Workflow):** Design submission → Stores material verification & issue → Production manufacturing execution & customer delivery.
- **Loop 2 (Financial Workflow):** Accounts actual invoice collection & cost variance calculation → System automated archival & business transaction closure.
- **Executive Notification Model:** Senior Managers and General Managers do NOT perform manual approvals or rejections; they receive real-time notifications on state transitions and monitor operations via executive dashboards.

## Backend Modular Structure
The NestJS server leverages a modular hierarchy structure with controllers, services, repositories, and interfaces for proper separation of concerns.
