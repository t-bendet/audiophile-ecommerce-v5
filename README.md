# 🎧 Audiophile E-Commerce

<div align="center">

**A production-ready, full-stack e-commerce platform for premium audio equipment**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=flat&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=flat&logo=react-query&logoColor=white)](https://tanstack.com/query)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=flat&logo=turborepo&logoColor=white)](https://turbo.build/)

[Live Demo](https://audiophile-client-i8rq.onrender.com) · [API Docs](https://audiophile-server.onrender.com/api/v1/health) · [Report Bug](https://github.com/t-bendet/audiophile-ecommerce-v5/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture--design-decisions)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Key Design Decisions](#-key-design-decisions)
- [What's Next](#-whats-next)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

Audiophile is a comprehensive, enterprise-grade e-commerce application showcasing modern full-stack development practices. Built with TypeScript throughout, it demonstrates clean architecture, type safety from database to UI, and production-ready patterns including authentication, cart management, and secure checkout.

### Live Demo

- **Client**: [audiophile-client.onrender.com](https://audiophile-client-i8rq.onrender.com)
- **API**: [audiophile-server.onrender.com](https://audiophile-server.onrender.com)

> **Note**: Hosted on Render's free tier - may take 30-60 seconds for initial load due to cold starts.

---

## ✨ Features

### User-Facing Features

- ✅ **Product Catalog** - Browse audio equipment by category (Headphones, Earphones, Speakers)
- ✅ **Product Details** - Detailed product pages with image galleries, specifications, and related products
- ✅ **Shopping Cart** - Add/remove items, quantity management, persistent cart sync across sessions
- ✅ **User Authentication** - Secure JWT-based signup/login with httpOnly cookies
- ✅ **User Account** - Profile management with order history
- ✅ **Checkout Flow** - Complete purchase workflow with order summary and validation
- ✅ **Responsive Design** - Mobile-first design, optimized for all screen sizes
- ✅ **Accessible UI** - Built with Radix UI primitives for WCAG compliance
- ✅ **SEO & Performance** - Lighthouse optimizations for accessibility, best practices, and SEO

### Technical Features

- 🔒 **Security First**
  - Helmet middleware for security headers
  - Rate limiting on critical endpoints (login, signup, orders)
  - JWT authentication with secure cookie storage
  - Input validation at multiple layers
  - CORS protection with origin whitelisting

- 🚀 **Performance**
  - TanStack Query caching with smart refetch strategies
  - Optimistic updates for instant UI feedback
  - Background data synchronization
  - Turborepo build caching
  - Query deduplication

- 🎯 **Developer Experience**
  - End-to-end type safety (database → API → UI)
  - Shared types and validation schemas
  - Hot module replacement in development
  - Comprehensive error handling with custom error codes
  - Monorepo architecture with workspace dependencies

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.1 | UI library with latest improvements |
| **React Router** | v7.11 | File-based routing with middleware support |
| **TypeScript** | 5.8 | Type safety throughout the application |
| **Vite** | 7.0 | Lightning-fast build tool and dev server |
| **TailwindCSS** | 4.1 | Utility-first styling framework |
| **TanStack Query** | v5.83 | Server state management with caching |
| **TanStack Form** | v1.27 | Type-safe form handling |
| **Axios** | 1.11 | HTTP client with interceptors |
| **Zod** | 4.0 | Runtime validation and type inference |
| **Radix UI** | Latest | Accessible, unstyled component primitives |
| **Lucide React** | 0.533 | Beautiful icon library |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20.x | JavaScript runtime |
| **Express** | 5.1 | Web framework for REST API |
| **TypeScript** | 5.9 | Type-safe backend code |
| **Prisma** | Latest | Type-safe ORM with MongoDB support |
| **MongoDB Atlas** | Cloud | Managed cloud database |
| **JWT** | 9.0 | Stateless authentication tokens |
| **Zod** | 4.0 | Request/response validation |
| **Helmet** | 8.1 | Security headers middleware |
| **Express Rate Limit** | 8.2 | API rate limiting protection |
| **CORS** | 2.8 | Cross-origin resource sharing |
| **Morgan** | 1.10 | HTTP request logging |

### Shared Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Turborepo** | Monorepo build orchestration with distributed caching |
| **pnpm** | Fast, efficient package manager with workspace support |
| **ESLint** | Code quality and consistency |
| **Prettier** | Code formatting |
| **Render** | Cloud hosting platform (free tier) |

### Monorepo Packages

```
packages/
├── database/         # Prisma client, schema, migrations, seed data
├── domain/           # Shared types, DTOs, Zod schemas, error codes
├── config-eslint/    # Shared ESLint configurations
└── config-typescript/# Shared TypeScript base configs
```

---

## 🏗 Architecture & Design Decisions

### Monorepo Structure

```
audiophile-ecommerce-v5/
├── apps/
│   ├── client/              # React + Vite frontend
│   │   ├── src/
│   │   │   ├── app/routes/  # React Router v7 routes
│   │   │   ├── features/    # Feature modules (auth, cart, products)
│   │   │   ├── components/  # Shared UI components
│   │   │   ├── lib/         # Utilities (api-client, react-query)
│   │   │   └── types/       # TypeScript type definitions
│   │   └── public/          # Static assets
│   │
│   └── server/              # Express + Prisma backend
│       ├── src/
│       │   ├── controllers/ # Request handlers (thin layer)
│       │   ├── services/    # Business logic (extends AbstractCrudService)
│       │   ├── routes/      # Route definitions + validation
│       │   ├── middlewares/ # Auth, validation, error handling
│       │   └── utils/       # Helpers (catchAsync, AppError)
│       └── docs/            # API documentation
│
├── packages/
│   ├── database/            # Prisma schema and client
│   │   ├── prisma/schema/   # Multi-file domain schemas
│   │   ├── src/seed/        # Database seed scripts
│   │   └── scripts/         # Custom Prisma post-processing
│   ├── domain/              # Shared types, DTOs, validation
│   ├── config-eslint/       # Shared linting configs
│   └── config-typescript/   # Shared TS configs
│
├── docs/                    # Project documentation
├── .github/                 # GitHub Actions & instructions
├── turbo.json              # Turborepo configuration
├── pnpm-workspace.yaml     # Workspace configuration
└── render.yaml             # Deployment configuration
```

---

## 🎯 Key Design Decisions

### 1. **Layered Backend Architecture**

```
Route → Middleware (validation) → Controller → Service → Prisma
```

**Why**: Clean separation of concerns with clear responsibility boundaries.

- **Routes**: Define endpoints and attach middleware
- **Middleware**: Validate inputs with Zod, check authentication
- **Controllers**: Handle HTTP concerns, thin orchestration layer
- **Services**: Business logic, complex operations, transactions
- **Prisma**: Type-safe database access

**Benefits**:
- Easy to test (mock each layer independently)
- Clear error handling flow
- Reusable business logic
- Maintainable and scalable

**Example Flow**:
```typescript
// Route definition
router.post('/products',
  validateSchema(productCreateSchema),  // Validation middleware
  authMiddleware,                        // Auth middleware
  catchAsync(productController.create)   // Error wrapper
);

// Controller (thin layer)
async create(req, res) {
  const product = await productService.create(req.verified.body);
  res.status(201).json({ data: product });
}

// Service (business logic)
async create(input: ProductCreateInput) {
  return this.prisma.product.create({
    data: input,
  });
}
```

### 2. **Abstract CRUD Service Pattern**

All database services extend `AbstractCrudService<Entity, CreateInput, UpdateInput, DTO>`:

```typescript
export abstract class AbstractCrudService<
  Entity,
  CreateInput,
  UpdateInput,
  DTO
> {
  // Template methods (implementing class must define)
  protected abstract toDTO(entity: Entity): DTO;
  protected abstract persistFindMany(params: ExtendedQueryParams): Promise<Entity[]>;
  protected abstract persistFindById(id: string): Promise<Entity | null>;
  protected abstract persistCreate(data: CreateInput): Promise<Entity>;
  protected abstract persistUpdate(id: string, data: UpdateInput): Promise<Entity>;
  protected abstract persistDelete(id: string): Promise<Entity>;

  // Public interface (consistent across all services)
  async findMany(params: ExtendedQueryParams): Promise<DTO[]>
  async findById(id: string): Promise<DTO>
  async create(data: CreateInput): Promise<DTO>
  async update(id: string, data: UpdateInput): Promise<DTO>
  async delete(id: string): Promise<DTO>
}
```

**Why**: Reduces boilerplate while maintaining flexibility.

- Consistent CRUD operations across all entities
- Built-in DTO transformation for security (exclude sensitive fields)
- Centralized error handling
- Type-safe database operations
- Easy to extend with custom methods

**Benefits**:
- Write once, use everywhere pattern
- Enforces consistent data access patterns
- Automatic DTO mapping prevents data leaks (passwords, internal IDs)
- Reduces bugs through standardization

### 3. **Multi-File Prisma Schema Organization**

Schema organized by domain instead of a single massive file:

```
prisma/schema/
├── schema.prisma       # Datasource & generator config
├── user.prisma         # User accounts, roles, auth
├── product.prisma      # Products, images, metadata
├── category.prisma     # Product categories
├── cart.prisma         # Shopping carts, cart items
├── order.prisma        # Orders, order items
└── config.prisma       # Application configuration
```

**Why**: Better organization and maintainability.

- Easier to navigate and understand
- Allows parallel development by domain
- Clear boundaries between features
- Reduces merge conflicts
- Better for code reviews

### 4. **ESM + Custom Prisma Post-Processing**

The project uses ES Modules with a custom script that fixes Prisma imports:

```javascript
// fix-prisma-imports-robust.cjs
// Adds .js extensions to imports in generated Prisma client
// from './models' → from './models.js'
```

**Why**: Node.js ESM requires explicit file extensions, but Prisma doesn't add them.

**How it works**:
1. Run `pnpm db:generate`
2. Prisma generates client code
3. Custom script patches imports with `.js` extensions
4. Code works correctly with Node.js ESM

**Important**: Always use `pnpm db:generate` (not just `prisma generate`)

### 5. **Domain Package - Single Source of Truth**

All shared code lives in `@repo/domain`:

```typescript
// Shared across frontend and backend
export { ProductDTO, ProductCreateInput, ProductUpdateInput } from './product';
export { UserDTO, UserPublicInfo } from './user';
export { ErrorCode } from './error-codes';
export { productCreateSchema, productUpdateSchema } from './validation';
```

**Why**: Prevents drift and ensures consistency.

- Frontend and backend use identical types
- No duplication of validation logic
- Type safety from database to UI
- Single place to update contracts
- Compile-time errors if types don't match

**Benefits**:
- Impossible to have mismatched types
- Refactoring is safer
- API changes automatically show errors in frontend
- Reduces bugs from manual synchronization

### 6. **Five-Layer Validation Strategy**

Defense-in-depth approach to data validation:

```
┌─────────────────────────────────────┐
│ 1. Route Middleware (Zod)          │ ← Structure validation
│    validateSchema(productSchema)    │
├─────────────────────────────────────┤
│ 2. Controller Logic                 │ ← Business rules, authorization
│    if (!user.canEdit) throw...      │
├─────────────────────────────────────┤
│ 3. Prisma Extensions                │ ← Data-level validation
│    Password hashing, soft deletes   │
├─────────────────────────────────────┤
│ 4. Database Constraints             │ ← Data integrity
│    Unique, foreign keys, NOT NULL   │
├─────────────────────────────────────┤
│ 5. Response Mapping (DTO)           │ ← Security, field omission
│    Exclude: password, internal IDs  │
└─────────────────────────────────────┘
```

**Why**: Each layer catches different types of errors.

**Layer 1 - Route Middleware**:
```typescript
// Validates structure, types, formats
router.post('/products', validateSchema(productCreateSchema), ...)
```

**Layer 2 - Controller Logic**:
```typescript
// Validates business rules
if (product.price < 0) throw new AppError('Price must be positive', 400);
if (!user.isAdmin) throw new AppError('Unauthorized', 403);
```

**Layer 3 - Prisma Extensions**:
```typescript
// Data transformations
prisma.$extends({
  query: {
    user: {
      async create({ args, query }) {
        args.data.password = await hash(args.data.password);
        return query(args);
      }
    }
  }
});
```

**Layer 4 - Database Constraints**:
```prisma
model User {
  id    String @id @default(auto())
  email String @unique  // Enforced by database
  name  String          // NOT NULL by default
}
```

**Layer 5 - Response Mapping**:
```typescript
// Remove sensitive data before sending to client
protected toDTO(user: User): UserDTO {
  const { password, passwordResetToken, ...safeUser } = user;
  return safeUser;
}
```

### 7. **TanStack Query for Server State**

All server data managed through React Query:

```typescript
// Define query options
export const getProductsQueryOptions = () =>
  queryOptions({
    queryKey: ['products'],
    queryFn: () => api.get('/products'),
    staleTime: 60000, // Consider fresh for 1 minute
  });

// Use in component
const { data, isPending } = useQuery(getProductsQueryOptions());

// Prefetch in loader
export async function loader({ context }) {
  await context.get(queryClientContext)
    .prefetchQuery(getProductsQueryOptions());
}
```

**Why**: Better UX with smart caching and retry strategies.

**Features**:
- Automatic caching and deduplication
- No retry on 4xx errors (client errors are final)
- Retry up to 2 times on 5xx errors (exponential backoff)
- Background refetching when data becomes stale
- Optimistic updates for instant feedback

**Benefits**:
- Less loading states shown to users
- Faster navigation (cached data)
- No duplicate requests
- Better error handling
- Better perceived performance

### 8. **React Router v7 Middleware**

Authentication and logging at the route level:

```typescript
// Authentication middleware
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }) => {
    const user = await getUserFromSession(request);
    if (!user) throw redirect('/login');
    context.set(userContext, user);
  },
];

// Logging middleware
async function loggingMiddleware({ request }, next) {
  const start = performance.now();
  const response = await next();
  console.log(`${request.method} ${request.url} - ${performance.now() - start}ms`);
  return response;
}
```

**Why**: More efficient than component-level checks.

- Runs before route handlers and components
- Prevents unnecessary rendering
- Better performance
- Cleaner separation of concerns
- Can transform request/response

### 9. **Centralized Error Handling**

All errors classified to semantic types with specific codes:

```typescript
// Error codes in @repo/domain
export enum ErrorCode {
  // 400s - Client errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 422,

  // 500s - Server errors
  INTERNAL_SERVER_ERROR = 500,
  DATABASE_ERROR = 503,
}

// Throw errors with context
throw new AppError('Product not found', ErrorCode.NOT_FOUND);

// Automatic error handling in middleware
app.use(globalErrorHandler);
```

**Why**: Consistent error handling across the application.

**Benefits**:
- Clear error messages for users
- Better debugging with error codes
- Automatic error logging in production
- Sanitized errors in production (no stack traces leaked)
- Structured validation errors

**Error Flow**:
```
Controller throws AppError
    ↓
Caught by globalErrorHandler middleware
    ↓
Development: Full stack trace + details
Production: Sanitized message + error code
    ↓
Client receives structured error
    ↓
React Query retry logic (if applicable)
    ↓
UI shows appropriate error message
```

### 10. **MongoDB + Prisma ORM**

Using MongoDB Atlas with Prisma for type-safe database access:

**Why MongoDB**:
- Flexible schema for product images and metadata
- Embedded documents for related data (product images, cart items)
- Fast reads for product catalogs
- Easy to scale horizontally
- Cloud-native with Atlas

**Why Prisma**:
- Type-safe queries generated from schema
- Migration management
- Excellent TypeScript integration
- Built-in connection pooling
- Great developer experience

**Schema Design**:
```prisma
model Product {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String   @unique
  price       Int
  images      ProductImages  // Embedded document
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  String   @db.ObjectId
}

type ProductImages {
  primaryImage    ProductImagesProperties
  galleryImages   ProductImagesProperties[]
  thumbnail       ProductsImagesThumbnail
  // More image variants...
}
```

Benefits of embedded images:
- Single query to fetch product + all images
- No N+1 query problems
- Type-safe image access
- Flexible structure

### 11. **Security-First Approach**

Multiple layers of security implemented:

**Rate Limiting**:
```typescript
// Global rate limit
app.use('/api', rateLimit({
  limit: 500,
  windowMs: 15 * 60 * 1000, // 15 minutes
}));

// Strict rate limiting for sensitive endpoints
const authLimiter = rateLimit({
  limit: 5,
  windowMs: 15 * 60 * 1000,
});
router.post('/auth/login', authLimiter, loginHandler);
router.post('/auth/signup', authLimiter, signupHandler);
```

**Security Headers** (Helmet):
```typescript
app.use(helmet()); // Adds security headers
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Strict-Transport-Security: max-age=15552000
```

**CORS Protection**:
```typescript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
}));
```

**JWT Authentication**:
```typescript
// Secure cookies
res.cookie('jwt', token, {
  httpOnly: true,      // No JavaScript access
  secure: true,        // HTTPS only in production
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

**Input Validation**:
```typescript
// All inputs validated with Zod
router.post('/products',
  validateSchema(productCreateSchema.strict()), // Reject extra fields
  createHandler
);
```

### 12. **Recent Security & Performance Enhancements**

Based on recent commits and the current branch (`fix/lighthouse-a11y-bp-seo`):

**Security Improvements** (February 2026):
- ✅ Implemented rate limiting for authentication endpoints
- ✅ Added rate limiting for order creation
- ✅ Refactored cookie options for secure handling in production
- ✅ Added Helmet middleware for security headers
- ✅ Enhanced CORS configuration with origin validation
- ✅ Proper middleware ordering (CORS → Rate Limit → Security → Body Parsing)

**Lighthouse Optimizations** (In Progress):
- 🚧 Accessibility improvements
- 🚧 Best practices enhancements
- 🚧 SEO optimizations
- 🚧 Semantic HTML improvements
- 🚧 ARIA labels and alt text refinements

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **pnpm** 10.26.2 or higher (`npm install -g pnpm`)
- **MongoDB** Atlas account or local instance ([Sign Up](https://www.mongodb.com/atlas))

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/t-bendet/audiophile-ecommerce-v5.git
cd audiophile-ecommerce-v5
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Set up environment variables**:

Create `.env` files in the following locations:

**`packages/database/.env`**:
```env
DATABASE_URL=mongodb+srv://[user]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority&appName=[appName]
```

**`apps/server/.env`**:
```env
DATABASE_URL=mongodb+srv://[user]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority&appName=[appName]
NODE_ENV=development
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=20000
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173
VITE_APP_PORT=5173
```

**`apps/client/.env`**:
```env
VITE_APP_API_URL=http://localhost:8000
```

> **🔒 Security Note**: Never commit `.env` files to version control. Use strong, unique secrets in production.

4. **Generate Prisma client**:
```bash
pnpm db:generate
```

This runs Prisma generation + our custom post-processing script to fix ESM imports.

5. **Seed the database**:
```bash
pnpm db:seed
```

Seeds the database with:
- Product categories (Headphones, Earphones, Speakers)
- Sample products with images and metadata
- Application configuration

6. **Start development servers**:
```bash
# Start both client and server
pnpm dev

# Or start individually
pnpm dev:client  # Client: http://localhost:5173
pnpm dev:server  # Server: http://localhost:8000
```

7. **Access the application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1
- Health Check: http://localhost:8000/api/v1/health

### Build for Production

```bash
# Build all packages and apps
pnpm build

# Start production servers
pnpm prod:client  # Preview client build
pnpm prod:server  # Start production server
```

---

## 📁 Project Structure

### Backend Architecture

```
apps/server/src/
├── app.ts                 # Express app configuration
├── index.ts               # Server entry point
├── controllers/           # HTTP request handlers (thin layer)
│   ├── auth.controller.ts
│   ├── product.controller.ts
│   ├── cart.controller.ts
│   └── order.controller.ts
├── services/              # Business logic layer
│   ├── abstract-crud.service.ts  # Base CRUD service
│   ├── user.service.ts
│   ├── product.service.ts
│   ├── cart.service.ts
│   └── order.service.ts
├── routes/                # Route definitions
│   ├── index.ts           # Root router
│   ├── auth.routes.ts
│   ├── product.routes.ts
│   └── cart.routes.ts
├── middlewares/           # Express middleware
│   ├── auth.middleware.ts       # JWT verification
│   ├── validation.middleware.ts # Zod validation
│   └── error.middleware.ts      # Global error handler
└── utils/                 # Utility functions
    ├── catchAsync.ts      # Async error wrapper
    ├── appError.ts        # Custom error class
    └── env.ts             # Environment variables

docs/
├── SERVICE_LAYER_EXAMPLE.md   # Service layer patterns
├── VALIDATION_STRATEGY.md     # Validation approach
└── ERROR_FLOW.md              # Error handling guide
```

### Frontend Architecture

```
apps/client/src/
├── app/
│   ├── routes/            # React Router v7 routes
│   │   ├── home/
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   └── signup.tsx
│   │   ├── category/
│   │   │   └── $categorySlug.tsx
│   │   ├── product/
│   │   │   └── $productSlug.tsx
│   │   ├── checkout/
│   │   ├── account/
│   │   └── not-found/
│   └── root.tsx           # Root layout
├── features/              # Feature modules
│   ├── auth/
│   │   ├── api/           # Auth API calls
│   │   ├── components/    # Auth components
│   │   └── lib/           # Auth utilities
│   ├── cart/
│   │   ├── api/
│   │   ├── components/
│   │   └── hooks/
│   ├── products/
│   │   ├── api/
│   │   ├── components/
│   │   └── types/
│   └── categories/
├── components/            # Shared UI components
│   ├── ui/                # Radix UI components
│   ├── layouts/
│   └── page-sections/
├── lib/                   # Core utilities
│   ├── api-client.ts      # Axios instance & interceptors
│   ├── react-query.ts     # React Query setup
│   ├── cart-sync.ts       # Cart synchronization logic
│   └── errors/            # Error handling utilities
└── types/                 # TypeScript types
    └── api.ts             # API types
```

### Shared Packages

```
packages/
├── database/
│   ├── prisma/
│   │   └── schema/        # Domain-organized schemas
│   │       ├── schema.prisma
│   │       ├── user.prisma
│   │       ├── product.prisma
│   │       ├── category.prisma
│   │       ├── cart.prisma
│   │       ├── order.prisma
│   │       └── config.prisma
│   ├── src/
│   │   └── seed/          # Database seed scripts
│   ├── scripts/
│   │   └── fix-prisma-imports-robust.cjs  # ESM fix
│   └── generated/         # Prisma client (generated)
│
├── domain/
│   ├── src/
│   │   ├── index.ts       # Main exports
│   │   ├── user/          # User DTOs & schemas
│   │   ├── product/       # Product DTOs & schemas
│   │   ├── cart/          # Cart DTOs & schemas
│   │   ├── order/         # Order DTOs & schemas
│   │   ├── error-codes.ts # Error code enum
│   │   └── common.ts      # Shared types
│   └── dist/              # Built types (generated)
│
├── config-eslint/
│   └── index.js           # Shared ESLint config
│
└── config-typescript/
    ├── base.json          # Base tsconfig
    ├── nextjs.json        # Next.js config
    └── react-library.json # React library config
```

---

## 📚 Available Scripts

### Root Level (Monorepo)

```bash
# Development
pnpm dev              # Start all apps in parallel
pnpm dev:client       # Start only the client
pnpm dev:server       # Start only the server

# Building
pnpm build            # Build all packages and apps with Turborepo caching

# Database
pnpm db:generate      # Generate Prisma client + fix ESM imports (ALWAYS use this)
pnpm db:seed          # Seed database with sample data
pnpm db:push          # Push schema changes to database (dev only)

# Code Quality
pnpm lint             # Run ESLint on all packages
pnpm format           # Format all code with Prettier
pnpm types:watch      # Watch mode type checking for all packages

# Production
pnpm start            # Start all apps in production mode
pnpm prod:client      # Start client production server
pnpm prod:server      # Start server production server
```

### Client-Specific

```bash
cd apps/client

pnpm dev              # Start Vite dev server (HMR enabled)
pnpm build            # Build for production (dist folder)
pnpm prod             # Preview production build locally
pnpm lint             # Run ESLint
```

### Server-Specific

```bash
cd apps/server

pnpm dev              # Start with nodemon (auto-restart on changes)
pnpm build            # Build with tsup
pnpm build:tsc        # Build with tsc (for type checking)
pnpm type-check       # Type check without building
pnpm start            # Start production server
```

---

## 🔮 What's Next

### High Priority

#### Security & Authentication
- [ ] **Forgot Password & Reset Flow**
  - Implement password reset token generation
  - Email service integration for reset links
  - Password reset form with validation
  - Location: `apps/server/src/controllers/auth.controller.ts`

- [ ] **Password Strength Meter**
  - Real-time password strength feedback
  - Visual indicator on signup form
  - Location: `apps/client/src/features/auth/signup-form.tsx`

- [ ] **Show/Hide Password Toggle**
  - Toggle visibility for password inputs
  - Location: `apps/client/src/features/auth/login-form.tsx`

#### Checkout & Orders
- [ ] **Server-Side Price Calculation**
  - Move pricing logic from client to server
  - Prevent price tampering
  - Calculate tax and shipping based on location
  - Location: `apps/server/src/services/order.service.ts`
  - Context: Currently prices calculated on client (security issue)

- [ ] **Order Confirmation Emails**
  - Send order confirmation after checkout
  - Include order details and tracking info

#### Admin Features
- [ ] **Admin Dashboard**
  - Product management (CRUD operations)
  - Order management and fulfillment
  - User management
  - Analytics dashboard

- [ ] **Cloudinary Integration**
  - Image upload from dashboard
  - Automatic optimization and transformations
  - CDN delivery for faster loading
  - Context: `todos.js:34`

#### Performance Optimizations
- [ ] **WebP Image Format**
  - Convert all images to WebP for better compression
  - Fallback to PNG/JPEG for unsupported browsers
  - Context: `apps/client/todos.ts:103`

- [ ] **Preload Critical Resources**
  - Implement React preload API
  - Preload fonts, critical images
  - Context: `apps/client/todos.ts:102`

- [ ] **Code Splitting**
  - Split vendor bundles
  - Lazy load routes
  - Reduce initial bundle size

- [ ] **Image Lazy Loading**
  - Implement intersection observer for images
  - Progressive image loading

### Medium Priority

#### Product Features
- [ ] **Advanced Product Filtering**
  - Filter by price range
  - Filter by features and specifications
  - Filter by availability
  - Context: Needs query builder utility

- [ ] **Product Search**
  - Full-text search implementation
  - Search autocomplete
  - Search result highlighting

- [ ] **Product Reviews & Ratings**
  - User review system
  - Star ratings
  - Review moderation

- [ ] **Wishlist Feature**
  - Save products for later
  - Wishlist management
  - Share wishlist

#### Cart & Checkout
- [ ] **Cart Optimization**
  - Send only changed items instead of full cart
  - Better merge conflict handling
  - Location: `apps/client/src/lib/cart-sync.ts:24-26`

- [ ] **Checkout Enhancement**
  - Address book management
  - Multiple payment methods
  - Guest checkout option

#### User Experience
- [ ] **Order Tracking**
  - Real-time order status updates
  - Email notifications for status changes
  - Tracking number integration

- [ ] **SEO Improvements**
  - Implement React 19 Document Metadata
  - Structured data for products
  - XML sitemap generation
  - Open Graph tags
  - Context: `apps/client/todos.ts:4`

- [ ] **Skeleton Loaders**
  - Add skeleton screens for loading states
  - Better perceived performance
  - Context: `apps/client/todos.ts:74`

- [ ] **Switch to Sonner**
  - Replace Radix toast with Sonner
  - Better toast animations and stacking
  - Context: `apps/client/todos.ts:77`

### Low Priority

#### Features
- [ ] **Dark Mode**
  - Theme switching
  - Persistent theme preference
  - Smooth transitions

- [ ] **Multi-language Support**
  - i18n implementation
  - RTL support
  - Language switcher

- [ ] **Social Authentication**
  - OAuth with Google
  - OAuth with GitHub
  - Link multiple auth providers

- [ ] **Payment Gateway Integration**
  - Stripe or PayPal integration
  - Secure payment processing
  - Webhook handling for payment events

- [ ] **Inventory Management**
  - Stock tracking
  - Low stock alerts
  - Automatic out-of-stock handling

- [ ] **Advanced Analytics**
  - User behavior tracking
  - Conversion funnel analysis
  - A/B testing framework

### Technical Debt & Refactoring

#### Backend
- [ ] **Improve AbstractCrudService Typing**
  - Constrain Where, Select to match Entity structure
  - Better type safety with mapped types
  - Location: `apps/server/src/services/abstract-crud.service.ts`
  - Context: `todos.js:45-52`

- [ ] **Query Builder Utility**
  - Centralize filtering, sorting, pagination logic
  - Reusable across all services
  - Context: `todos.js:94`

- [ ] **Optimize Related Products Query**
  - Reduce database roundtrips with aggregation
  - Location: `apps/server/src/services/product.service.ts:224`
  - Context: `todos.js:15`

- [ ] **Refactor Category Schema**
  - Change from NAME enum to runtime-created categories
  - Better flexibility for content management
  - Location: `packages/database/prisma/schema/category.prisma`
  - Context: `todos.js:61-67`

- [ ] **Consolidate Validation Error Codes**
  - Clear distinction between 400 and 422 errors
  - Location: `packages/domain/src/error-codes.ts`
  - Context: `todos.js:55`

- [ ] **Add JSDoc Comments**
  - Document all service methods
  - Better IntelliSense in IDEs
  - Context: `todos.js:99`

- [ ] **Product isNew as Virtual Property**
  - Calculate based on arrival date
  - Less than 1 year = new
  - Context: `todos.js:87`

- [ ] **Handle Product Slugs**
  - Clarify slug generation strategy
  - User-provided vs auto-generated
  - Context: `todos.js:37`

#### Frontend
- [ ] **Refactor Auth with Router Middleware**
  - Use React Router v7 middleware for auth checks
  - Remove component-level auth logic
  - Location: `apps/client/src/features/auth/`
  - Context: `apps/client/todos.ts:17`

- [ ] **Centralize Cart State Management**
  - Consider Zustand for local cart state
  - Better sync logic with server
  - Context: `apps/client/todos.ts:32-33`

- [ ] **Improve React Query Usage**
  - Better caching strategies
  - Optimized stale times
  - Smarter refetching
  - Context: `apps/client/todos.ts:18`

- [ ] **Dialog Component Variants**
  - Create variants for cart, thank you, navigation
  - Reduce code duplication
  - Context: `apps/client/todos.ts:76`

- [ ] **Responsive Design Polish**
  - Improve ErrorBlock responsiveness
  - Mobile optimizations
  - Context: `apps/client/todos.ts:75`

- [ ] **Add Error Severity Levels**
  - Distinguish between critical and non-critical errors
  - Better error prioritization
  - Context: `apps/client/todos.ts:55`

#### Database & Data
- [ ] **Standardize Prisma Optional Fields**
  - Decide between `field? Type` vs `field Type?`
  - Apply consistently across schema
  - Location: `packages/database/prisma/schema/product.prisma`
  - Context: `todos.js:69-80`

- [ ] **Add Null Values to Seed Data**
  - Test optional fields properly
  - Context: `todos.js:81`

- [ ] **Refactor Category Prisma Relations**
  - Add products relation
  - Implement cascade delete
  - Context: `todos.js:62`

---

## 🚢 Deployment

The application is deployed on [Render](https://render.com) using the `render.yaml` blueprint for GitOps-style continuous deployment.

### Current Deployment

- **Client**: [audiophile-client-i8rq.onrender.com](https://audiophile-client-i8rq.onrender.com)
- **Server**: [audiophile-server.onrender.com](https://audiophile-server.onrender.com)
- **Tier**: FREE (may experience cold starts after inactivity)

### Deploy Your Own Instance

1. **Fork this repository**

2. **Create a Render account**
   - Sign up at [render.com](https://render.com)

3. **Connect your repository**
   - Go to Render dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub account
   - Select your forked repository
   - Render will auto-detect `render.yaml`

4. **Set environment variables**

   In Render dashboard, add these environment variables:

   **Server (audiophile-server)**:
   - `DATABASE_URL`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Auto-generated by Render
   - `ALLOWED_ORIGINS`: Your client URL (e.g., `https://your-client.onrender.com`)

   **Client (audiophile-client)**:
   - `VITE_APP_API_URL`: Your server URL (e.g., `https://your-server.onrender.com`)

5. **Deploy**
   - Render will automatically build and deploy both services
   - Subsequent pushes to `main` branch trigger automatic deployments
   - Pull requests generate preview deployments (client only)

### Render Configuration

```yaml
# render.yaml (simplified)
services:
  # Express API Server
  - type: web
    name: audiophile-server
    runtime: node
    plan: free
    buildCommand: pnpm install && pnpm turbo run build --filter=server...
    startCommand: node apps/server/dist/index.js
    healthCheckPath: /api/v1/health

  # React Client (Static Site)
  - type: web
    name: audiophile-client
    runtime: static
    buildCommand: pnpm install && pnpm turbo run build --filter=client...
    staticPublishPath: apps/client/dist
    pullRequestPreviewsEnabled: true
```

### MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write access
3. Add Render's IP ranges to IP whitelist (or use `0.0.0.0/0` for development)
4. Copy connection string to `DATABASE_URL` environment variable

### Deployment Features

- ✅ Automatic deployments from `main` branch
- ✅ Pull request previews (client)
- ✅ Health checks for server uptime monitoring
- ✅ Security headers configured
- ✅ SPA routing handled with rewrite rules
- ✅ Build caching with Turborepo
- ✅ Environment variable management

---

## 🤝 Contributing

This is a personal portfolio project built to demonstrate full-stack TypeScript development skills. While it's primarily for showcase purposes, I welcome feedback, suggestions, and discussions about the architecture and implementation.

### How to Contribute

1. **Report Bugs**: Open an issue with detailed reproduction steps
2. **Suggest Features**: Open an issue with your feature idea and use case
3. **Discuss Architecture**: Open a discussion about design decisions
4. **Submit Pull Requests**: For bug fixes or minor improvements

### Development Guidelines

If you want to contribute code:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the existing code patterns and conventions
4. Write meaningful commit messages
5. Ensure all types are correct (`pnpm types:watch`)
6. Test your changes locally
7. Submit a pull request with a clear description

### Code Standards

- Follow the patterns in [`.github/copilot-instructions.md`](.github/copilot-instructions.md)
- Use TypeScript strict mode
- Validate inputs with Zod
- Write descriptive commit messages
- Keep components small and focused
- Add comments for complex logic

---

## 📄 License

MIT License - Copyright (c) 2026 Tal Bendet

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

Feel free to use this code for learning, inspiration, or your own projects!

---

## 🙏 Acknowledgments

- **Design**: Inspired by [Frontend Mentor's Audiophile Challenge](https://www.frontendmentor.io/)
- **Purpose**: Built as a portfolio project to demonstrate enterprise-grade full-stack development
- **Community**: Thanks to the amazing open-source community for the incredible tools and libraries used in this project

### Special Thanks To

- **Turborepo Team** - For making monorepos manageable
- **Prisma Team** - For the best TypeScript ORM experience
- **TanStack Team** - For React Query and Form libraries
- **Radix UI Team** - For accessible component primitives
- **Vercel Team** - For React and Next.js innovations
- **All Open Source Contributors** - Building the tools we all depend on

---

## 📞 Contact

**Tal Bendet**

- GitHub: [@t-bendet](https://github.com/t-bendet)
- Project Link: [github.com/t-bendet/audiophile-ecommerce-v5](https://github.com/t-bendet/audiophile-ecommerce-v5)
- Live Demo: [audiophile-client-i8rq.onrender.com](https://audiophile-client-i8rq.onrender.com)

---

## 📊 Project Stats

- **Lines of Code**: ~15,000+
- **Packages**: 4 shared packages, 2 applications
- **Tech Stack**: 30+ technologies
- **Type Safety**: 100% TypeScript
- **Security**: Multiple layers of protection
- **Performance**: Optimized caching and lazy loading

---

<div align="center">

**Made with ❤️ and TypeScript**

⭐ Star this repo if you find it helpful!

[Live Demo](https://audiophile-client-i8rq.onrender.com) · [Report Issue](https://github.com/t-bendet/audiophile-ecommerce-v5/issues) · [Request Feature](https://github.com/t-bendet/audiophile-ecommerce-v5/issues)

</div>

---

**Last Updated**: February 11, 2026
