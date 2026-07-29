# Environment Variables Configuration

This file documents the environment variables required to run the application locally or in production.

## 1. Frontend Configuration (`frontend/.env`)

| Variable Name | Description | Example Value |
| --- | --- | --- |
| `VITE_API_URL` | Base endpoint URL for the NestJS API | `http://localhost:3000/api` |
| `VITE_SOCKET_URL` | Socket gateway address for live notification sync | `http://localhost:3000` |
| `VITE_APP_NAME` | Client brand name shown on login and header elements | `Indent Application` |

## 2. Backend Configuration (`backend/.env`)

| Variable Name | Description | Example Value |
| --- | --- | --- |
| `DATABASE_URL` | Connection URL for Prisma database datasource | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Signature key for verifying JWT authentication tokens | `super_secret_key` |
| `JWT_EXPIRES_IN` | Session duration expiration token standard | `1d` |
| `PORT` | Local hosting port for API Server | `3000` |
| `FRONTEND_URL` | Access URL mapping for CORS origins | `http://localhost:5173` |
| `SMTP_HOST` | Host server address for sending transactional emails | `smtp.mailtrap.io` |
| `SMTP_PORT` | Port value mapping for mail servers | `2525` |
| `SMTP_USER` | Authenticated username for mail client | `user` |
| `SMTP_PASS` | Password signature for mail client | `pass` |
