# Validation Strategy Guide

## Table of Contents

1. [Validation Layers Overview](#validation-layers-overview)
2. [Where Validation Happens](#where-validation-happens)
3. [Request Types & Validation Points](#request-types--validation-points)
4. [Input vs Output Validation](#input-vs-output-validation)
5. [Validation by HTTP Method](#validation-by-http-method)
6. [Schema Design Patterns](#schema-design-patterns)
7. [Prisma Extensions & Validation](#prisma-extensions--validation)
8. [Best Practices](#best-practices)

---

## Validation Layers Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                            │
│         (params, query, body - UNTRUSTED)                    │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  LAYER 1: Route Middleware        │
         │  ✓ validateSchema(ZodSchema)      │
         │  ✓ Validates structure & types    │
         │  ✓ Transforms data if needed      │
         │  ✓ REJECT early (422/400)         │
         └────────────┬──────────────────────┘
                      │
                      ▼ (validated input)
         ┌───────────────────────────────────┐
         │  LAYER 2: Controller Logic        │
         │  ✓ Business logic validation      │
         │  ✓ Authorization checks           │
         │  ✓ Custom AppError throws         │
         └────────────┬──────────────────────┘
                      │
                      ▼ (business-validated)
         ┌───────────────────────────────────┐
         │  LAYER 3: Prisma Extensions       │
         │  ✓ Data-level validation          │
         │  ✓ Password hashing               │
         │  ✓ Soft delete filtering          │
         │  ✓ Auto-timestamps                │
         └────────────┬──────────────────────┘
                      │
                      ▼ (database operation)
         ┌───────────────────────────────────┐
         │  LAYER 4: Database Constraints    │
         │  ✓ Unique constraints             │
         │  ✓ Foreign keys                   │
         │  ✓ NOT NULL checks                │
         │  ✓ PrismaClientKnownRequestError  │
         └────────────┬──────────────────────┘
                      │
                      ▼ (data retrieved)
         ┌───────────────────────────────────┐
         │  LAYER 5: Response Mapping        │
         │  ⚠️  NO validation (optional)     │
         │  ✓ DTO mapping (security)         │
         │  ✓ Field omission (passwords)     │
         └────────────┬──────────────────────┘
                      │
                      ▼
         ┌───────────────────────────────────┐
         │       SEND RESPONSE TO CLIENT     │
         └───────────────────────────────────┘
```

---

## Where Validation Happens

### ✅ ALWAYS Validate (Layer 1 - Input)

**Location**: Route Middleware (`validateSchema`)  
**Purpose**: Protect against malicious/malformed data  
**What to validate**:

- Request params (`:id`, `:slug`, `:category`)
- Query strings (`?page=1&sort=price`)
- Request body (JSON payloads)

```typescript
// Example: Product route with validation
router.route("/slug/:slug").get(
  validateSchema(GetProductBySlugSchema), // ← VALIDATE HERE
  productController.getProductBySlug
);
```

### ✅ SOMETIMES Validate (Layer 2 - Business Logic)

**Location**: Controller or Service Layer  
**Purpose**: Complex business rules & authorization  
**What to validate**:

- **Authorization** (can user perform this action?)
- Resource ownership (is this user's resource?)
- State transitions (e.g., can't cancel shipped order)
- Cross-field business logic (e.g., discount < price)
- External API responses (third-party data)

**Note**: Authentication (who is the user?) happens in **middleware** before controller.

```typescript
// Example: Controller with business logic validation
export const updateProduct: RequestHandler = catchAsync(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
  });

  // Authorization check
  if (req.user.role !== "ADMIN" && product.userId !== req.user.id) {
    throw new AppError("You don't have permission to update this product", 403);
  }

  // Business logic validation
  if (product.publishedAt && req.body.price < product.price * 0.5) {
    throw new AppError(
      "Cannot reduce published product price by more than 50%",
      400
    );
  }

  // ... update product
});
```

### ✅ BUILT-IN Validate (Layer 3 - Prisma Extensions)

**Location**: `packages/database/src/client.ts`  
**Purpose**: Data transformations & defaults  
**What happens**:

- Password hashing on create/update
- Soft delete filtering on queries
- Auto-populated timestamps
- Default values

```typescript
// Example: User extension with password hashing
.$extends({
  query: {
    user: {
      async create({ args, query }) {
        const hashedPassword = await hashPassword(args.data.password);
        args.data.password = hashedPassword;
        args.data.passwordConfirm = hashedPassword;
        return query(args);
      }
    }
  }
})
```

### ✅ ENFORCE (Layer 4 - Database)

**Location**: Prisma schema constraints  
**Purpose**: Data integrity  
**What's enforced**:

- Unique fields (`@@unique`)
- Required fields (no `?`)
- Foreign key relationships
- Enum constraints

```prisma
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  email String @unique  // ← Database enforces uniqueness
  role  ROLE   @default(USER)  // ← Enum constraint
}
```

### ❌ RARELY Validate (Layer 5 - Output)

**Location**: Response DTOs (optional)  
**Purpose**: Type safety & documentation (dev-time only)  
**When to use**:

- Development debugging
- Catching schema mismatches
- Never in production (performance cost)

```typescript
// Example: Optional output validation in dev
if (process.env.NODE_ENV === "development") {
  ProductPublicSchema.parse(product); // Catch shape mismatches
}
```

---

## Request Types & Validation Points

### Request Anatomy

```typescript
// Full request object structure
{
  params: { id: "507f1f77bcf86cd799439011", slug: "xx99-mark-two" },
  query: { page: "1", limit: "20", sort: "-price" },
  body: { name: "Product Name", price: 1999 },
  headers: { authorization: "Bearer token..." }
}
```

### Validation Mapping

| Request Part | Source            | Validation                  | Schema Location |
| ------------ | ----------------- | --------------------------- | --------------- |
| **params**   | URL path segments | ✅ Required                 | `@repo/domain`  |
| **query**    | URL search params | ✅ Required for filters     | `@repo/domain`  |
| **body**     | Request payload   | ✅ Required for mutations   | `@repo/domain`  |
| **headers**  | HTTP headers      | ⚠️ Manual (auth middleware) | N/A             |

---

## Input vs Output Validation

### Input Validation (ALWAYS)

**Purpose**: Security, data integrity, early rejection  
**Location**: `validateSchema` middleware  
**Characteristics**:

- Uses `.strict()` to reject unknown fields
- Transforms data (strings → numbers, dates)
- Provides detailed error messages to clients

```typescript
// Input Schema Example (from @repo/domain)
export const CreateUserSchema = z.object({
  body: z
    .object({
      name: NameValidator("User"),
      email: EmailValidator,
      password: PasswordValidator(),
      passwordConfirm: PasswordValidator("Password confirm"),
    })
    .strict(), // ← Rejects unknown fields
});
```

### Output Validation (RARELY)

**Purpose**: Type safety, dev debugging  
**Location**: Controller (optional)  
**Characteristics**:

- NO `.strict()` (DB may have extra fields)
- Only in development
- Performance cost not worth it in production

```typescript
// Output Schema Example (from @repo/domain)
const ProductByCategorySchema = z.object({
  slug: z.string(),
  fullLabel: z.array(z.string()),
  id: IdValidator("product"),
  isNewProduct: z.boolean(),
  images: z.object({
    introImage: z.object({
      mobileSrc: z.string(),
      // ...
    }),
  }),
}); // NO .strict() - allows extra DB fields
```

**Recommendation**: Skip output validation. Use TypeScript + Prisma types instead.

---

## Validation by HTTP Method

### GET Requests

**What to validate**:

- ✅ params (IDs, slugs)
- ✅ query (pagination, filters, sorting)
- ❌ body (should be empty)

```typescript
// GET /products/:id?page=1&limit=20
const GetProductSchema = z.object({
  params: z
    .object({
      id: IdValidator("Product"),
    })
    .strict(),
  query: z
    .object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
    })
    .strict(),
});
```

**Error Strategy**: Simple messages (client just needs to know request is invalid)

```typescript
// Good for GET
"Invalid product ID format";

// Overkill for GET
"Validation failed: params.id must be 24 character hex string";
```

### POST Requests (Create)

**What to validate**:

- ✅ body (all required fields)
- ⚠️ params (if nested resource, e.g., `/users/:userId/posts`)
- ❌ query (rarely used)

```typescript
// POST /products
const CreateProductSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100),
      price: z.number().positive(),
      categoryId: IdValidator("Category"),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      // ... all required fields
    })
    .strict(),
});
```

**Error Strategy**: Detailed field-level errors (help user fix submission)

```typescript
{
  status: "fail",
  message: "Validation failed: body.price must be positive, body.name is required"
}
```

### PUT/PATCH Requests (Update)

**What to validate**:

- ✅ params (resource ID)
- ✅ body (fields to update - all or partial)
- ❌ query (rarely used)

```typescript
// PATCH /products/:id
const UpdateProductSchema = z.object({
  params: z
    .object({
      id: IdValidator("Product"),
    })
    .strict(),
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      price: z.number().positive().optional(),
      // ... all fields optional for PATCH
    })
    .strict(),
});
```

**Business Logic Validation** (controller layer):

```typescript
// Prevent changing slug on published products
if (product.publishedAt && req.body.slug) {
  throw new AppError("Cannot change slug of published product", 400);
}
```

### DELETE Requests

**What to validate**:

- ✅ params (resource ID)
- ❌ body (should be empty)
- ❌ query (rarely used)

```typescript
// DELETE /products/:id
const DeleteProductSchema = z.object({
  params: z
    .object({
      id: IdValidator("Product"),
    })
    .strict(),
});
```

**Business Logic Validation**:

```typescript
// Soft delete check
if (product.deleted) {
  throw new AppError("Product already deleted", 404);
}
```

---

## Schema Design Patterns

### Pattern 1: Params Only (Simple GET)

```typescript
// GET /products/:id
export const GetProductByIdSchema = z.object({
  params: z
    .object({
      id: IdValidator("Product"),
    })
    .strict(),
});
```

### Pattern 2: Params + Query (Filtered GET)

```typescript
// GET /products/category/:category?page=1&sort=-price
export const GetProductsByCategorySchema = z.object({
  params: z
    .object({
      category: z.enum(CategoryNameValues),
    })
    .strict(),
  query: z
    .object({
      page: z.string().transform(Number).optional().default("1"),
      sort: z.enum(["price", "-price", "name", "-name"]).optional(),
    })
    .strict(),
});
```

### Pattern 3: Body Only (Simple POST)

```typescript
// POST /users
export const CreateUserSchema = z.object({
  body: z
    .object({
      name: NameValidator("User"),
      email: EmailValidator,
      password: PasswordValidator(),
      passwordConfirm: PasswordValidator(),
    })
    .strict()
    .refine((data) => data.password === data.passwordConfirm, {
      message: "Passwords must match",
      path: ["passwordConfirm"],
    }),
});
```

### Pattern 4: Params + Body (Nested POST/PATCH)

```typescript
// PATCH /users/:id
export const UpdateUserSchema = z.object({
  params: z
    .object({
      id: IdValidator("User"),
    })
    .strict(),
  body: z
    .object({
      name: NameValidator("User").optional(),
      email: EmailValidator.optional(),
    })
    .strict(),
});
```

### Pattern 5: Complex Cross-Field Validation

```typescript
// POST /orders (validate discount vs total)
export const CreateOrderSchema = z.object({
  body: z
    .object({
      items: z.array(OrderItemSchema).min(1),
      discount: z.number().min(0).optional(),
      total: z.number().positive(),
    })
    .strict()
    .refine(
      (data) => {
        const itemsTotal = data.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const discountedTotal = itemsTotal - (data.discount || 0);
        return Math.abs(discountedTotal - data.total) < 0.01;
      },
      {
        message: "Total must match items total minus discount",
        path: ["total"],
      }
    ),
});
```

---

## Prisma Extensions & Validation

### Extension Types

| Extension Type         | Purpose               | Validation Role                   |
| ---------------------- | --------------------- | --------------------------------- |
| `query.$allOperations` | Intercept all queries | Filter/transform (soft delete)    |
| `query.create`         | Intercept creates     | Hash passwords, set defaults      |
| `query.update`         | Intercept updates     | Hash passwords, update timestamps |
| `model.methodName`     | Add custom methods    | Return filtered/transformed data  |
| `result.fieldName`     | Virtual fields        | Computed values (NOT validation)  |

### When to Use Extensions for Validation

✅ **DO use extensions for**:

- Password hashing (data transformation)
- Soft delete filtering (data filtering)
- Auto-timestamps (data enrichment)
- Default values (data enrichment)

```typescript
// Good: Auto-hash passwords on create
.$extends({
  query: {
    user: {
      async create({ args, query }) {
        args.data.password = await hashPassword(args.data.password);
        return query(args);
      }
    }
  }
})
```

❌ **DON'T use extensions for**:

- User input validation (use middleware)
- Business logic validation (use controllers)
- Complex cross-entity validation (use services)
- Authorization (use middleware)

```typescript
// Bad: Don't validate in extension
.$extends({
  query: {
    product: {
      async create({ args, query }) {
        // ❌ DON'T DO THIS
        if (args.data.price < 0) {
          throw new Error("Price must be positive");
        }
        return query(args);
      }
    }
  }
})

// Good: Validate in middleware before it reaches Prisma
router.post("/products",
  validateSchema(CreateProductSchema),  // ✅ DO THIS
  productController.createProduct
);
```

### Extension Best Practices

1. **Keep extensions for data operations only**
2. **Don't throw custom errors in extensions** (let Prisma errors bubble up)
3. **Don't access request context** (req, res) in extensions
4. **Keep business logic in controllers**

---

## Best Practices

### 1. Layer Separation

```
Input Validation (Middleware)
    ↓
Business Logic (Controller)
    ↓
Data Operations (Prisma Extensions)
    ↓
Database Constraints (Schema)
```

### 2. Error Message Strategy

| Request Type   | Error Detail Level | Status Code | Example                                                    |
| -------------- | ------------------ | ----------- | ---------------------------------------------------------- |
| GET            | Low (simple)       | 400         | "Invalid ID format"                                        |
| POST/PUT/PATCH | High (detailed)    | 422         | "body.price: must be positive number, body.name: required" |
| DELETE         | Medium             | 400/404     | "Resource not found"                                       |

**Status Code Usage**:

- `422 Unprocessable Entity` - Validation middleware catches malformed input
- `400 Bad Request` - Global error handler catches ZodError or semantic errors
- `404 Not Found` - Resource doesn't exist
- `401 Unauthorized` - Authentication failed
- `403 Forbidden` - Authorization failed (authenticated but no permission)

### 3. Validation Checklist

**For every new endpoint**:

- [ ] Define schema in `@repo/domain` or `@repo/validators`
- [ ] Add `validateSchema(schema)` to route
- [ ] Use `.strict()` on input schemas
- [ ] NO `.strict()` on output schemas
- [ ] Handle business logic in controller
- [ ] Let Prisma extensions handle data ops
- [ ] Don't validate output (unless debugging)

### 4. Schema Organization

```
packages/
  validators/
    src/
      index.ts          # Common validators (IdValidator, EmailValidator)
      product.ts        # Product-specific schemas
  domain/
    src/
      product.ts        # Product domain schemas & types
      user.ts           # User domain schemas & types
```

**Rule**:

- Generic validators → `@repo/validators`
- Domain-specific schemas → `@repo/domain`
- Both can be imported by server

### 5. TypeScript Integration

```typescript
// Extract types from schemas
export type CreateProductInput = z.infer<typeof CreateProductSchema.shape.body>;
export type ProductListQuery = z.infer<
  typeof ProductListQuerySchema.shape.query
>;

// Use in controller
export const createProduct: RequestHandler = catchAsync(async (req, res) => {
  const data: CreateProductInput = req.body; // Typed from schema
  // ...
});
```

### 6. Performance Considerations

**Do**:

- ✅ Validate all inputs (security critical)
- ✅ Use `.transform()` for type coercion (query strings)
- ✅ Fail fast with early validation
- ✅ Use `.strict()` on body/params to prevent injection

**Don't**:

- ❌ Validate outputs in production (trust your DB)
- ❌ Deep validate nested relations (use Prisma types)
- ❌ Re-validate in multiple layers (validate once, early)

**Special Cases**:

```typescript
// Query params: Consider NOT using .strict() if you want to allow tracking params
export const GetProductsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    // Don't use .strict() here - allows utm_source, etc. to pass through
  }),
});

// Body/Params: ALWAYS use .strict() for security
export const CreateProductSchema = z.object({
  body: z
    .object({
      name: z.string(),
      price: z.number(),
    })
    .strict(), // ✅ Prevents prototype pollution attacks
});
```

### 7. Testing Strategy

```typescript
// Test validation schemas independently
describe("CreateProductSchema", () => {
  it("should accept valid product data", () => {
    const result = CreateProductSchema.safeParse({
      body: { name: "Product", price: 100 /* ... */ },
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative price", () => {
    const result = CreateProductSchema.safeParse({
      body: { name: "Product", price: -10 },
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain("price");
  });
});
```

---

## Summary Decision Matrix

| Scenario                       | Where to Validate           | Status Code | Why                        |
| ------------------------------ | --------------------------- | ----------- | -------------------------- |
| User input (params/query/body) | Middleware (validateSchema) | 422         | Security, early rejection  |
| Complex business rules         | Controller                  | 400         | Business logic layer       |
| Password hashing               | Prisma extension            | N/A         | Data transformation        |
| Soft delete filtering          | Prisma extension            | N/A         | Data filtering             |
| Unique email                   | Database constraint         | 400         | Data integrity             |
| Authentication (who?)          | Middleware (before routes)  | 401         | Identity verification      |
| Authorization (can do?)        | Controller/Middleware       | 403         | Permission check           |
| API response shape             | ❌ Don't validate           | N/A         | Trust DB, use TypeScript   |
| Cross-field validation         | Schema `.refine()`          | 422         | Keep with input validation |
| Resource ownership             | Controller                  | 403/404     | Business logic             |
| Missing resource               | Controller                  | 404         | Resource doesn't exist     |
| External API response          | Service/Controller          | 502/500     | Third-party data           |

**Golden Rule**: Validate inputs aggressively, trust outputs implicitly.

---

## Common Pitfalls to Avoid

### ❌ Don't: router.param() for validation

```typescript
// Problematic: Hard to track, global side effects
router.param("id", validateSchema(GetByIdSchema));

router.route("/:id").get(controller.getById);
router.route("/category/:id").get(controller.getCategoryById); // Uses same validation!
```

✅ **Better: Explicit route-level validation**

```typescript
router.route("/:id").get(
  validateSchema(GetProductByIdSchema), // Clear what's validated
  controller.getById
);

router.route("/category/:id").get(
  validateSchema(GetCategoryByIdSchema), // Different validation
  controller.getCategoryById
);
```

### ❌ Don't: Validate in Prisma extensions

```typescript
// Bad: Mixes concerns
.$extends({
  query: {
    product: {
      async create({ args, query }) {
        if (!args.data.name || args.data.price < 0) {  // ❌ Wrong layer
          throw new Error("Invalid product");
        }
        return query(args);
      }
    }
  }
})
```

✅ **Better: Validate in middleware**

```typescript
router.post(
  "/products",
  validateSchema(CreateProductSchema), // ✅ Right layer
  controller.createProduct
);
```

### ❌ Don't: Mix authentication and authorization

```typescript
// Confusing: What does this check?
if (!req.user) {
  throw new AppError("Unauthorized", 401); // Is this auth or authz?
}
```

✅ **Better: Separate concerns**

```typescript
// Authentication (identity)
if (!req.user) {
  throw new AppError("Authentication required", 401);
}

// Authorization (permission)
if (req.user.role !== "ADMIN") {
  throw new AppError("Admin access required", 403);
}
```
