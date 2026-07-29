# Database Design

## 1. ER Diagram Summary
The database stores user identity data, indents, materials, vendor info, and workflow states.

## 2. Table Schemas

### Users
- `id` (UUID, PK)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR)
- `roleId` (UUID, FK to Roles)

### Roles
- `id` (UUID, PK)
- `name` (VARCHAR, Unique)

### Indents
- `id` (UUID, PK)
- `indentNo` (VARCHAR, Unique)
- `status` (VARCHAR)
- `creatorId` (UUID, FK to Users)
