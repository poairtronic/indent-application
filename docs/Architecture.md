# System Architecture

## Architecture Overview
The system follows a decoupling client-server pattern.

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
       |     PostgreSQL    |
       +-------------------+
```

## Backend Modular Structure
The NestJS server leverages a modular hierarchy structure with controllers, services, repositories, and interfaces for proper separation of concerns.
