# API Documentation

## Authentication Endpoint
- `POST /api/auth/login` - Authenticates user credentials and returns JWT.

## Indent Endpoints
- `POST /api/indents` - Creates a new indent.
- `GET /api/indents` - Lists indents with filters.
- `GET /api/indents/:id` - Retrieves a specific indent details.
- `PATCH /api/indents/:id/status` - Updates indent status (e.g. approve/reject).

## Users Endpoints
- `GET /api/users/profile` - Retrieves authenticated user metadata.
