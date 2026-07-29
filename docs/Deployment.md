# Deployment Guide

## Production Setup

### Docker Deployment
The environment can be run inside a multi-container Docker cluster managed by Compose.
```bash
docker-compose up -d --build
```

### Environment Variables
Configure the following variable values in production:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `NODE_ENV`
