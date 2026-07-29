# Indent Application

A full-stack application for managing material indents, costing, inventory, vendors, products, and production workflows.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, CSS
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Database**: PostgreSQL (or SQLite/MySQL depending on configuration)

## Project Structure
- `frontend/` - React SPA frontend codebase
- `backend/` - NestJS API backend codebase
- `database/` - Prisma schemas, migrations, seeds, and backups
- `docs/` - System documentation including Requirement Analysis, SRS, API docs, and database designs
- `scripts/` - Shell scripts for automation, backups, etc.

## Setup Instructions

### Backend
1. Go to `backend/` directory
2. Install dependencies: `npm install`
3. Configure environment variables in `backend/.env`
4. Run migrations: `npx prisma migrate dev`
5. Start in dev mode: `npm run start:dev`

### Frontend
1. Go to `frontend/` directory
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
