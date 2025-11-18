# GSD Database Schema

This document provides a visual representation of the GSD database schema generated from the Prisma schema file.

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ List : "owns"
    User ||--o{ Task : "owns"
    List ||--o{ Task : "contains"

    User {
        uuid id PK
        string email UK
        string googleId UK "google_id"
        string name "nullable"
        datetime createdAt "created_at"
        datetime updatedAt "updated_at"
    }

    List {
        uuid id PK
        string name
        float orderIndex "order_index"
        boolean isBacklog "is_backlog, default false"
        boolean isDone "is_done, default false"
        string color "nullable"
        uuid userId FK "user_id, CASCADE"
        datetime createdAt "created_at"
        datetime updatedAt "updated_at"
    }

    Task {
        uuid id PK
        string title
        string description "nullable"
        float orderIndex "order_index"
        uuid listId FK "list_id, CASCADE"
        uuid userId FK "user_id, CASCADE"
        datetime completedAt "completed_at, nullable"
        datetime createdAt "created_at"
        datetime updatedAt "updated_at"
    }
```

## Relationships

- **User → List**: One-to-many (cascade delete)
- **User → Task**: One-to-many (cascade delete)
- **List → Task**: One-to-many (cascade delete)

## Database Indexes

### users table

- `email` - Unique index for fast user lookups

### lists table

- `(userId, orderIndex)` - Composite index for ordered list retrieval
- `(userId, isDone)` - Composite index for filtering Done lists

### tasks table

- `(userId, listId, orderIndex)` - Composite index for ordered task retrieval within lists
- `(userId, completedAt)` - Composite index for filtering completed tasks

## Key Constraints

- All foreign keys use CASCADE delete to maintain referential integrity
- UUIDs used for all primary keys
- Unique constraints on `email` and `googleId` for users
- Timestamps (`createdAt`, `updatedAt`) automatically managed by Prisma

## Source

Generated from: `apps/backend/prisma/schema.prisma`
