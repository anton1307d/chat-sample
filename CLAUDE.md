# CLAUDE.md - AI Assistant Development Guide

This document provides comprehensive guidance for AI assistants working with this chat application codebase.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Codebase Structure](#codebase-structure)
4. [Technology Stack](#technology-stack)
5. [Development Workflow](#development-workflow)
6. [Key Conventions](#key-conventions)
7. [Common Tasks](#common-tasks)
8. [Important Patterns](#important-patterns)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

This is a **production-ready real-time chat application** built with a microservices architecture. The application enables users to:
- Register and authenticate securely
- Create and participate in conversations
- Send and receive messages in real-time via WebSocket
- Track online/offline presence
- View message history with pagination

**Architecture Pattern**: Monorepo with event-driven microservices using the API Gateway pattern.

**Repository Status**:
- Latest commit: `2123571 fix`
- Branch: `claude/claude-md-mi3kp7quufniw6ze-01DfDPpoHUez1ZR9ePJaoE3B`

---

## Architecture

### Microservices Overview

```
┌─────────────┐
│   Client    │ (React SPA)
└──────┬──────┘
       │
       ├──────HTTP──────► ┌──────────────┐
       │                  │ API Gateway  │ :3000
       │                  └──────┬───────┘
       │                         │
       │                         ├──HTTP──► ┌──────────────┐
       │                         │          │ Users Service│ :3004
       │                         │          │ (PostgreSQL) │
       │                         │          └──────────────┘
       │                         │
       │                         └──HTTP──► ┌──────────────┐
       │                                    │ Chat Service │ :3003
       │                                    │ (PostgreSQL  │
       │                                    │  + MongoDB)  │
       │                                    └──────┬───────┘
       │                                           │
       └──────WebSocket───► ┌────────────────┐    │
                            │ WebSocket GW   │ :3002
                            └───────┬────────┘    │
                                    │             │
                                    └──RabbitMQ───┘

Infrastructure:
- PostgreSQL: User data, conversations, participants
- MongoDB: Message storage (flexible schema)
- Redis: Caching, sessions, Socket.IO adapter
- RabbitMQ: Event-driven message queue
```

### Communication Patterns

1. **Synchronous HTTP**: Client ↔ API Gateway ↔ Microservices
2. **Real-time WebSocket**: Client ↔ WebSocket Gateway (Socket.IO)
3. **Asynchronous Events**: Services communicate via RabbitMQ for message delivery

---

## Codebase Structure

```
/home/user/chat-sample/
├── apps/                           # Microservices & frontend
│   ├── api-gateway/               # HTTP request router :3000
│   │   ├── src/
│   │   │   ├── auth/              # JWT authentication
│   │   │   ├── proxy/             # Service proxying
│   │   │   ├── rate-limit/        # Rate limiting (1000/min)
│   │   │   └── main.ts
│   │   └── tsconfig.app.json
│   │
│   ├── users/                     # User management :3004
│   │   ├── src/
│   │   │   ├── auth/              # Login, register, tokens
│   │   │   ├── users/             # User CRUD
│   │   │   ├── presence/          # Online status tracking
│   │   │   └── main.ts
│   │   └── tsconfig.app.json
│   │
│   ├── chat/                      # Chat service :3003
│   │   ├── src/
│   │   │   ├── conversations/     # Conversation management
│   │   │   ├── messages/          # Message persistence
│   │   │   ├── rabbitmq/          # RabbitMQ consumers
│   │   │   └── main.ts
│   │   └── tsconfig.app.json
│   │
│   ├── websocket-gateway/         # Real-time gateway :3002
│   │   ├── src/
│   │   │   ├── gateway/           # Socket.IO implementation
│   │   │   │   ├── services/
│   │   │   │   │   ├── connection.service.ts
│   │   │   │   │   ├── room.service.ts
│   │   │   │   │   ├── message.service.ts
│   │   │   │   │   └── presence.service.ts
│   │   │   │   └── chat.gateway.ts
│   │   │   └── main.ts
│   │   └── tsconfig.app.json
│   │
│   └── web/                       # React frontend :3001
│       ├── src/
│       │   ├── app/               # Pages and routing
│       │   │   ├── (auth)/        # Login, register
│       │   │   └── (dashboard)/   # Main chat interface
│       │   ├── components/        # React components
│       │   │   ├── auth/
│       │   │   ├── chat/
│       │   │   ├── conversations/
│       │   │   ├── layout/
│       │   │   └── ui/
│       │   ├── lib/
│       │   │   ├── api/           # API client (Axios)
│       │   │   ├── socket/        # WebSocket client
│       │   │   ├── store/         # Zustand state management
│       │   │   └── utils/
│       │   └── index.tsx
│       ├── vite.config.ts
│       └── package.json
│
├── libs/                          # Shared libraries
│   ├── common/                    # Utilities & abstractions
│   │   ├── src/
│   │   │   ├── database/          # TypeORM base repository
│   │   │   ├── guards/            # Auth guards
│   │   │   ├── decorators/        # @Public(), @CurrentUser()
│   │   │   ├── filters/           # Exception filters
│   │   │   ├── interceptors/      # Logging, transformation
│   │   │   ├── logger/            # Pino logger
│   │   │   ├── models/            # Shared entities
│   │   │   ├── rabbitmq/          # RabbitMQ utilities
│   │   │   ├── utils/             # Hash, response helpers
│   │   │   └── index.ts
│   │   └── tsconfig.lib.json
│   │
│   └── contracts/                 # Event definitions
│       ├── src/
│       │   ├── constants/
│       │   │   ├── events.ts      # Event type constants
│       │   │   ├── queues.ts      # Queue/exchange names
│       │   │   └── services.ts    # Service identifiers
│       │   ├── events/            # Event interfaces
│       │   └── index.ts
│       └── tsconfig.lib.json
│
├── scripts/
│   ├── init-db.sql               # PostgreSQL initialization
│   └── init-mongo.js             # MongoDB initialization
│
├── docker-compose.yaml            # Complete infrastructure
├── nest-cli.json                  # NestJS monorepo config
├── package.json                   # Root dependencies & scripts
├── tsconfig.json                  # TypeScript config with path aliases
└── ormconfig.ts                   # TypeORM configuration
```

### Path Aliases (Critical!)

Always use these TypeScript path aliases:

```typescript
// CORRECT
import { UserEntity, AbstractRepository } from '@app/common';
import { MESSAGE_SENT, QUEUES } from '@app/contracts';

// INCORRECT
import { UserEntity } from '../../libs/common/src/models/user.entity';
```

**Configured in**: `tsconfig.json:20-32`

---

## Technology Stack

### Backend
- **Framework**: NestJS 11.1.6 (Node.js TypeScript framework)
- **Language**: TypeScript 5.9.2
- **Package Manager**: pnpm

### Databases
- **PostgreSQL 16**: Users (`chat_db`), conversations (`conversation_db`)
- **MongoDB 7**: Messages (`chat_messages` collection)
- **Redis 7**: Caching, sessions, Socket.IO adapter
- **RabbitMQ 3.12**: Event-driven messaging

### ORM/ODM
- **TypeORM 0.3.27**: PostgreSQL (with abstract repository pattern)
- **Mongoose 8.17.1**: MongoDB

### Real-time
- **Socket.IO 4.8.1**: WebSocket with polling fallback
- **Socket.IO Redis Adapter**: Multi-instance support

### Authentication & Security
- **JWT**: Token-based auth (1h access, 7d refresh)
- **Bcrypt**: Password hashing
- **Passport.js**: Auth middleware
- **Helmet**: Security headers
- **Throttler**: Rate limiting (100 req/15min default)

### Frontend
- **React 18.2.0**: UI framework
- **Vite 5.0.8**: Build tool
- **React Router 6.20.0**: Client routing
- **Zustand 4.4.7**: State management
- **Socket.IO Client 4.6.1**: WebSocket client
- **React Hook Form + Zod**: Form handling & validation
- **Tailwind CSS 3.3.6**: Styling
- **Lucide React**: Icon library

### DevOps
- **Docker & Docker Compose**: Containerization
- **Jest 30.0.5**: Testing
- **ESLint & Prettier**: Code quality

---

## Development Workflow

### Initial Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file (if not using Docker)
cp .env.example .env

# 3. Option A: Run with Docker (recommended)
docker-compose up -d

# 4. Option B: Run services locally
# Start databases first (PostgreSQL, MongoDB, Redis, RabbitMQ)
# Then start each service:
pnpm start:dev  # Starts all NestJS services in watch mode
cd apps/web && pnpm dev  # Start React frontend

# 5. Run database migrations
pnpm migration:run
```

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| Web Frontend | 3001 | http://localhost:3001 |
| API Gateway | 3000 | http://localhost:3000/api/v1 |
| WebSocket Gateway | 3002 | http://localhost:3002 |
| Chat Service | 3003 | http://localhost:3003 |
| Users Service | 3004 | http://localhost:3004 |
| PostgreSQL | 5432 | - |
| MongoDB | 27017 | - |
| Redis | 6379 | - |
| RabbitMQ | 5672 | - |
| RabbitMQ Management | 15672 | http://localhost:15672 |
| pgAdmin | 5050 | http://localhost:5050 |
| Mongo Express | 8081 | http://localhost:8081 |
| Redis Commander | 8089 | http://localhost:8089 |

### Making Changes

#### Backend Changes

1. **Adding a new endpoint**:
   - Add route to appropriate service (users, chat)
   - Update API Gateway proxy if needed
   - Follow NestJS controller/service pattern
   - Use DTOs with `class-validator` decorators

2. **Database changes**:
   ```bash
   # Generate migration
   pnpm migration:generate src/migrations/DescriptiveName

   # Review generated SQL
   # Edit if necessary

   # Apply migration
   pnpm migration:run
   ```

3. **Adding RabbitMQ events**:
   - Define event constant in `libs/contracts/src/constants/events.ts`
   - Define queue/routing key in `libs/contracts/src/constants/queues.ts`
   - Create event interface in `libs/contracts/src/events/`
   - Implement consumer in service

#### Frontend Changes

1. **Adding a new page**:
   - Create component in `apps/web/src/app/`
   - Add route to `App.tsx`
   - Use `PrivateRoute` or `PublicRoute` wrapper

2. **State management**:
   - Use Zustand stores in `apps/web/src/lib/store/`
   - Follow existing patterns (authStore, conversationsStore, messagesStore)

3. **API calls**:
   - Add function to appropriate file in `apps/web/src/lib/api/`
   - Use configured Axios instance with JWT interceptor

4. **WebSocket events**:
   - Emit via `socketService.emit(event, data)`
   - Listen via `socketService.on(event, callback)`
   - Clean up with `socketService.off(event, callback)` in useEffect

### Docker Workflow

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose up -d --build [service-name]

# Stop all services
docker-compose down

# Stop and remove volumes (DESTRUCTIVE)
docker-compose down -v
```

---

## Key Conventions

### Code Style

- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier (single quotes, trailing commas)
- **Run**: `pnpm lint` and `pnpm format` before committing

### Naming Conventions

1. **Files**:
   - Controllers: `*.controller.ts`
   - Services: `*.service.ts`
   - Entities: `*.entity.ts`
   - DTOs: `*.dto.ts`
   - Modules: `*.module.ts`
   - Guards: `*.guard.ts`
   - Decorators: `*.decorator.ts`

2. **Classes**:
   - PascalCase: `UserController`, `AuthService`
   - Suffix with type: `CreateUserDto`, `UserEntity`

3. **Variables/Functions**:
   - camelCase: `getUserProfile`, `isAuthenticated`
   - Boolean prefixes: `is`, `has`, `can`

4. **Constants**:
   - UPPER_SNAKE_CASE: `MESSAGE_SENT`, `JWT_SECRET`

### API Conventions

1. **REST Endpoints**:
   - Base: `/api/v1`
   - Plural nouns: `/users`, `/conversations`
   - Nested resources: `/conversations/:id/participants`

2. **HTTP Methods**:
   - GET: Read operations
   - POST: Create operations
   - PUT/PATCH: Update operations
   - DELETE: Delete operations

3. **Response Format**:
   ```typescript
   // Success
   {
     "success": true,
     "data": { ... },
     "message": "Operation successful"
   }

   // Error
   {
     "success": false,
     "error": {
       "message": "Error description",
       "code": "ERROR_CODE"
     }
   }
   ```

### WebSocket Events

**Naming**: `resource:action` (e.g., `message:send`, `conversation:join`)

**Key Events**:
- `connection:success`, `connection:error`
- `conversation:join`, `conversation:leave`
- `message:send`, `message:new`, `message:confirmed`
- `message:delivered`, `message:read`

### Environment Variables

Always provide defaults in code when possible:

```typescript
// GOOD
const port = process.env.PORT || 3000;
const redisHost = process.env.REDIS_HOST || 'localhost';

// AVOID (fails without env)
const jwtSecret = process.env.JWT_SECRET; // Required var
```

**Security Note**: Never commit `.env` files. Always use `.env.example` as template.

---

## Common Tasks

### Adding a New Microservice

1. Generate NestJS app:
   ```bash
   nest generate app my-service
   ```

2. Add to `nest-cli.json` projects section

3. Create Dockerfile in `apps/my-service/`

4. Add service to `docker-compose.yaml`

5. Update dependencies if needed

### Adding a Shared Library

1. Generate library:
   ```bash
   nest generate library my-lib
   ```

2. Export from `libs/my-lib/src/index.ts`

3. Add path alias to `tsconfig.json`:
   ```json
   "paths": {
     "@app/my-lib": ["libs/my-lib/src"],
     "@app/my-lib/*": ["libs/my-lib/src/*"]
   }
   ```

4. Import using alias: `import { ... } from '@app/my-lib';`

### Database Operations

```bash
# TypeORM Migrations
pnpm migration:generate src/migrations/AddUserColumn
pnpm migration:run
pnpm migration:revert
pnpm migration:show

# Direct database access
docker-compose exec postgres psql -U chat_user -d chat_db
docker-compose exec mongodb mongosh -u admin -p admin_password
```

### Debugging

1. **Backend**:
   ```bash
   pnpm start:debug
   # Attach debugger on port 9229
   ```

2. **Frontend**:
   - Use React DevTools
   - Check browser console
   - Vite shows errors in browser

3. **WebSocket**:
   - Use browser's WebSocket inspector
   - Check RabbitMQ management UI (port 15672)
   - Review Redis keys in Redis Commander (port 8089)

---

## Important Patterns

### Abstract Repository Pattern

**Location**: `libs/common/src/database/abstract.repository.ts`

All TypeORM repositories extend this base:

```typescript
export abstract class AbstractRepository<T extends AbstractEntity> {
  async create(entity: T): Promise<T>
  async findOne(where, relations?): Promise<T>
  async findOneAndUpdate(where, partialEntity): Promise<T>
  async find(where): Promise<T[]>
  async findOneAndDelete(where): Promise<void>
}
```

**Usage**:
```typescript
@Injectable()
export class UsersRepository extends AbstractRepository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {
    super(repository);
  }

  // Add custom methods
  async findByEmail(email: string): Promise<UserEntity> {
    return this.findOne({ where: { email } });
  }
}
```

### Authentication Flow

1. User logs in via API Gateway `/api/v1/auth/login`
2. API Gateway proxies to Users Service
3. Users Service validates credentials, generates JWT tokens
4. Returns `{ accessToken, refreshToken }`
5. Client stores tokens
6. Client includes `Authorization: Bearer {token}` in requests
7. API Gateway validates JWT using `JwtAuthGuard`
8. Refresh token endpoint: `/api/v1/auth/refresh`

**Guards**:
- `JwtAuthGuard`: Validates JWT on protected routes
- `@Public()`: Decorator to skip authentication

### WebSocket Message Flow

```
1. Client connects: socketService.connect(token)
2. Server validates JWT, emits 'connection:success'
3. Client joins conversation: emit('conversation:join', {conversationId})
4. Client sends message: emit('message:send', {conversationId, content})
5. WebSocket Gateway publishes to RabbitMQ
6. Chat Service consumes message, saves to DB
7. Chat Service publishes 'message.created' event
8. WebSocket Gateway consumes event
9. WebSocket Gateway emits 'message:new' to room
10. All clients in conversation receive message
11. WebSocket Gateway emits 'message:confirmed' to sender
```

### RabbitMQ Pattern

**Exchanges & Routing**:
- `chat.exchange` (topic): Message-related events
- `presence.exchange` (topic): User presence
- `user.exchange` (topic): User events

**Routing Keys**: `resource.action` (e.g., `message.create.request`, `message.created`)

**Dead Letter Queue**: Failed messages go to `dead-letter-queue`

**Consumer Pattern**:
```typescript
@Injectable()
export class MessageCreateConsumer extends BaseConsumer {
  constructor(private readonly messagesService: MessagesService) {
    super();
  }

  async consume(msg: ConsumeMessage) {
    const { conversationId, content, senderId } = JSON.parse(msg.content.toString());

    try {
      const message = await this.messagesService.create({
        conversationId,
        content,
        senderId,
      });

      // Publish success event
      this.publish(QUEUES.EXCHANGES.CHAT, 'message.created', message);

      // Acknowledge message
      this.ack(msg);
    } catch (error) {
      // Reject and requeue or send to DLQ
      this.nack(msg, false, false);
    }
  }
}
```

### Frontend State Management (Zustand)

**Pattern**:
```typescript
import { create } from 'zustand';

interface AuthState {
  // State
  isAuthenticated: boolean;
  user: User | null;

  // Actions
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,

  login: async (credentials) => {
    const { data } = await authApi.login(credentials);
    set({ isAuthenticated: true, user: data.user });
    // Store tokens in localStorage
  },

  logout: () => {
    set({ isAuthenticated: false, user: null });
    // Clear localStorage
  },

  setUser: (user) => set({ user }),
}));
```

**Usage**:
```typescript
const { isAuthenticated, login } = useAuthStore();
```

---

## Testing

### Backend Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# E2E tests (Docker-based)
pnpm test:e2e
```

**Test Structure**:
- Unit tests: `*.spec.ts` next to source files
- E2E tests: `apps/*/test/*.e2e-spec.ts`

**Example**:
```typescript
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should hash password', async () => {
    const password = 'test123';
    const hashed = await service.hashPassword(password);
    expect(hashed).not.toBe(password);
  });
});
```

### Frontend Testing

Tests not yet implemented. When adding:
- Use React Testing Library
- Test components in isolation
- Mock API calls and WebSocket

---

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Find and kill process
   lsof -ti:3000 | xargs kill -9
   # Or change port in docker-compose.yaml
   ```

2. **Database connection fails**:
   - Ensure databases are running: `docker-compose ps`
   - Check environment variables
   - Verify network: `docker network ls`

3. **RabbitMQ connection fails**:
   - Wait for healthcheck: `docker-compose logs rabbitmq`
   - Verify credentials in `.env`

4. **Module not found (path alias)**:
   - Check `tsconfig.json` paths
   - Restart TypeScript server in IDE
   - Rebuild: `pnpm build`

5. **WebSocket connection fails**:
   - Verify JWT token is valid
   - Check CORS settings in WebSocket Gateway
   - Ensure Redis is running (Socket.IO adapter)

6. **Hot reload not working**:
   - Check volume mounts in `docker-compose.yaml`
   - Restart service: `docker-compose restart [service]`

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway

# Last 100 lines
docker-compose logs --tail=100 chat-service
```

### Database Issues

```bash
# Reset PostgreSQL
docker-compose down -v
docker-compose up -d postgres
pnpm migration:run

# Reset MongoDB
docker-compose exec mongodb mongosh -u admin -p admin_password
> use chat_messages
> db.messages.drop()
```

---

## Guidelines for AI Assistants

### DO's

✅ Use path aliases (`@app/common`, `@app/contracts`)
✅ Follow NestJS module/controller/service pattern
✅ Use TypeScript types from DTOs and entities
✅ Implement proper error handling with try-catch
✅ Use existing decorators (`@Public()`, `@CurrentUser()`)
✅ Follow REST conventions for APIs
✅ Use WebSocket events with `resource:action` naming
✅ Write database migrations for schema changes
✅ Update both API Gateway and services for new endpoints
✅ Use environment variables with defaults
✅ Add proper validation using `class-validator`
✅ Document complex logic with comments
✅ Test changes locally before committing

### DON'Ts

❌ Don't use relative imports for shared libraries
❌ Don't bypass authentication guards without `@Public()`
❌ Don't commit `.env` files or secrets
❌ Don't modify database schema without migrations
❌ Don't create circular dependencies between services
❌ Don't use `any` type unless absolutely necessary
❌ Don't skip error handling in async operations
❌ Don't hardcode URLs or credentials
❌ Don't forget to clean up WebSocket listeners
❌ Don't modify shared libraries without considering impact
❌ Don't push directly to main branch

### Code Review Checklist

When implementing features, verify:

- [ ] TypeScript types are properly defined
- [ ] Path aliases are used for imports
- [ ] DTOs have validation decorators
- [ ] Error handling is implemented
- [ ] Authentication/authorization is correct
- [ ] Database queries are optimized
- [ ] WebSocket events are properly handled
- [ ] Environment variables are configurable
- [ ] Code follows existing patterns
- [ ] Comments explain complex logic
- [ ] No console.logs in production code
- [ ] Migrations are created for DB changes

### Performance Considerations

1. **Database**:
   - Use indexes for frequently queried fields
   - Paginate large result sets
   - Use select() to fetch only needed fields
   - Consider caching with Redis

2. **WebSocket**:
   - Implement rate limiting for events
   - Use rooms efficiently (one per conversation)
   - Clean up listeners on disconnect

3. **API**:
   - Use Redis for session storage
   - Implement response caching where appropriate
   - Set proper rate limits

### Security Considerations

1. **Authentication**:
   - Always validate JWT tokens
   - Use refresh token rotation
   - Set appropriate token expiration

2. **Input Validation**:
   - Validate all user inputs with DTOs
   - Sanitize data before database operations
   - Use parameterized queries (TypeORM handles this)

3. **Environment**:
   - Never commit secrets
   - Use strong JWT secrets in production
   - Enable HTTPS in production

---

## Quick Reference

### Import Examples

```typescript
// Shared libraries
import { UserEntity, AbstractRepository } from '@app/common';
import { MESSAGE_SENT, QUEUES } from '@app/contracts';

// NestJS
import { Controller, Get, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '@nestjs/passport';

// TypeORM
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
```

### Useful Commands

```bash
# Development
pnpm start:dev              # Start all services
pnpm start:debug            # Debug mode
cd apps/web && pnpm dev     # Frontend dev server

# Build
pnpm build                  # Build all services
cd apps/web && pnpm build   # Frontend build

# Database
pnpm migration:generate src/migrations/Name
pnpm migration:run

# Docker
docker-compose up -d
docker-compose down
docker-compose logs -f [service]
docker-compose restart [service]

# Code quality
pnpm lint
pnpm format
pnpm test
```

### API Examples

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get profile (authenticated)
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create conversation
curl -X POST http://localhost:3000/api/v1/chat/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Chat","participantIds":["user-id-1","user-id-2"]}'
```

---

## Additional Resources

- **NestJS Documentation**: https://docs.nestjs.com/
- **TypeORM Documentation**: https://typeorm.io/
- **Socket.IO Documentation**: https://socket.io/docs/
- **React Documentation**: https://react.dev/
- **Docker Compose**: https://docs.docker.com/compose/

---

## Maintenance Notes

**Last Updated**: 2025-11-17
**Version**: 0.0.1
**Current Branch**: `claude/claude-md-mi3kp7quufniw6ze-01DfDPpoHUez1ZR9ePJaoE3B`

When updating this document:
1. Keep architecture diagrams current
2. Update dependencies versions
3. Add new patterns as they emerge
4. Document breaking changes
5. Update troubleshooting section with new issues

---

**This document is maintained for AI assistants. Keep it updated as the codebase evolves.**
