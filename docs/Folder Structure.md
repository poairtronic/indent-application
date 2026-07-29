# Folder Structure Guideline

This project follows a structured fullstack decoupled monorepo.

## 1. Root Level
- `frontend/` - Client code (React + Vite + TypeScript)
- `backend/` - Server code (NestJS + Prisma)
- `database/` - Shared Prisma schema and migrations
- `docs/` - System design and configuration files
- `.github/` - CI/CD pipeline automation

## 2. Frontend Layout
- `src/app/` - Central application configs (App, main, routing, context providers)
- `src/components/` - Global components categorized into `common/`, `layout/`, `ui/`, `charts/`
- `src/modules/` - Feature modules containing components/views specific to that domain (e.g. `auth/`, `indent/`)
- `src/services/` - State-less business logic API clients
- `src/store/` - Reactive state stores

## 3. Backend Layout
- `src/[module]/` - Decoupled module clusters containing:
  - `dto/` - Data Transfer Objects for validation
  - `entities/` - Internal business entity structures
  - `controllers/` - HTTP Endpoint routers
  - `services/` - Internal business logic
  - `repository/` - Database abstractions
