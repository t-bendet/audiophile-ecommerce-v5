# Field Whitelisting Guide

How to ensure only allowed fields can be updated in your CRUD operations.

## Overview

There are **3 layers** of protection to prevent unwanted field updates:

```
┌────────────────────────────────────────────────────┐
│  1. Zod Schema (Route Middleware) - PRIMARY       │
│     ✓ Validates request structure                 │
│     ✓ Rejects extra fields with .strict()         │
│     ✓ Type-safe at compile time                   │
└────────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────┐
│  2. Service Layer Filtering - DEFENSE IN DEPTH    │
│     ✓ Whitelists specific updateable fields       │
│     ✓ Protects against internal misuse            │
│     ✓ Documents intent explicitly                 │
└────────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────┐
│  3. Database Constraints - FINAL SAFETY NET       │
│     ✓ Enforces immutability of certain fields     │
│     ✓ Prisma schema with @updatedAt, @default     │
└────────────────────────────────────────────────────┘
```

---

## Layer 1: Zod Schema Validation (PRIMARY)

**Location**: `packages/domain/src/*.ts`  
**Purpose**: Define exactly what fields can be updated via API

### ✅ Best Practice: Use `.strict()` and explicit fields

```typescript
// ❌ BAD: Accepts any fields
export const categoryUpdateSchema = z.object({
  body: z.object({
    label: z.string().optional(),
    description: z.string().optional(),
  }),
  // Missing .strict()!
});

// ✅ GOOD: Only allows specified fields
export const categoryUpdateSchema = z.object({
  params: z.object({ id: IdValidator("Category") }),
  body: z
    .object({
      label: z.string().min(1).optional(),
      description: z.string().optional(),
      // Only these 2 fields can be updated!
    })
    .strict(), // ← Rejects {label: "x", hackerField: "evil"}
  query: z.object({}).optional(),
});
```

### Apply in Routes

```typescript
import { validateSchema } from "../middlewares/validation.middleware.js";
import { categoryUpdateSchema } from "@repo/domain";

router.route("/:id").patch(
  validateSchema(categoryUpdateSchema), // ← Validation happens here
  categoryController.updateCategory
);
```

**Result**: Client sending `{ label: "New", id: "123", createdAt: "2024-01-01" }` will get a **422 error** because `id` and `createdAt` are not in the schema.

---

## Layer 2: Service Layer Filtering (DEFENSE IN DEPTH)

**Location**: `apps/server/src/services/*.service.ts`  
**Purpose**: Additional protection against internal misuse

### Why Add This?

1. **Defense in depth** - Protects even if route validation is misconfigured
2. **Internal API safety** - Service methods might be called from other services
3. **Self-documenting** - Explicitly shows which fields are updateable
4. **Business logic** - Can add conditional field filtering based on user role

### Implementation in AbstractCrudService

The base class now supports optional field filtering:

```typescript
// In abstract-crud.service.ts
async update(id: string, input: UpdateInput) {
  // Optional: Filter input to only allowed fields
  const validatedInput = this.filterUpdateInput
    ? this.filterUpdateInput(input)
    : input;

  const entity = await this.persistUpdate(id, validatedInput);
  if (!entity) throw new AppError("No document found with that ID", 404);
  return this.toDTO(entity);
}

protected filterUpdateInput?(input: UpdateInput): UpdateInput;

protected pickFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): Partial<T> {
  return fields.reduce((acc, field) => {
    if (field in obj) {
      acc[field] = obj[field];
    }
    return acc;
  }, {} as Partial<T>);
}
```

### Example: Category Service

```typescript
export class CategoryService extends AbstractCrudService<
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryDTO,
  CategoryWhereInput,
  CategorySelect,
  CategoryFilter
> {
  // ... other methods ...

  /**
   * Whitelist only allowed fields for updates
   * Prevents updating 'id', 'createdAt', 'v', etc.
   */
  protected filterUpdateInput(input: CategoryUpdateInput): CategoryUpdateInput {
    const allowedFields: (keyof CategoryUpdateInput)[] = ["name", "thumbnail"];

    return this.pickFields(input, allowedFields);
  }
}
```

### Advanced: Role-based Filtering

```typescript
export class ProductService extends AbstractCrudService<...> {
  private currentUserRole?: string;

  setUserContext(role: string) {
    this.currentUserRole = role;
  }

  protected filterUpdateInput(input: ProductUpdateInput): ProductUpdateInput {
    // Base fields everyone can update
    const allowedFields: (keyof ProductUpdateInput)[] = [
      'description',
      'images',
    ];

    // Admins can also update price and featured status
    if (this.currentUserRole === 'ADMIN') {
      allowedFields.push('price', 'featured', 'category');
    }

    return this.pickFields(input, allowedFields);
  }
}
```

Usage in controller:

```typescript
export const updateProduct: RequestHandler = catchAsync(async (req, res) => {
  productService.setUserContext(req.user.role); // Set context
  const dto = await productService.update(req.params.id, req.body);
  res.status(200).json({ status: "success", data: dto });
});
```

---

## Layer 3: Database Constraints (FINAL SAFETY NET)

**Location**: `packages/database/prisma/schema/*.prisma`  
**Purpose**: Enforce immutability at the database level

### Prisma Features

```prisma
model Category {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      NAME     // Enum - limited values
  createdAt DateTime @default(now())  // Auto-set on create
  updatedAt DateTime @updatedAt       // Auto-updated by Prisma
  v         Int      @default(0)      // Version field

  // Even if someone bypasses validation, these are protected:
  // - id: Cannot be changed (it's the @id)
  // - createdAt: Only set on creation
  // - updatedAt: Managed by Prisma
}
```

### Field Immutability Patterns

```typescript
// In Prisma extension (packages/database/src/client.ts)
.$extends({
  query: {
    category: {
      async update({ args, query }) {
        // Prevent certain fields from being updated
        const { id, createdAt, v, ...safeData } = args.data;

        // Force increment version on every update
        args.data = {
          ...safeData,
          v: { increment: 1 },
        };

        return query(args);
      }
    }
  }
})
```

---

## Complete Example: User Updates

Let's see all 3 layers working together:

### 1. Domain Schema (Layer 1)

```typescript
// packages/domain/src/user.ts
export const UpdateUserDetailsSchema = z.object({
  params: z.object({ id: IdValidator("User") }),
  body: z
    .object({
      name: z.string().min(2).max(50),
      email: z.string().email(),
      // Note: password, role, createdAt NOT included
    })
    .strict(), // ← Rejects extra fields
  query: z.object({}).optional(),
});
```

### 2. Service Filtering (Layer 2)

```typescript
// apps/server/src/services/user.service.ts
export class UserService extends AbstractCrudService<...> {
  protected filterUpdateInput(input: UserUpdateInput): UserUpdateInput {
    // Only these fields can be updated by regular users
    const allowedFields: (keyof UserUpdateInput)[] = [
      'name',
      'email',
      'avatar',
    ];

    // Note: 'password' has its own update endpoint
    // Note: 'role' can only be changed by admins via separate method

    return this.pickFields(input, allowedFields);
  }

  // Separate method for admin role updates
  async updateRole(userId: string, newRole: ROLE, adminId: string) {
    // Check if caller is admin
    // Log the role change
    // Update only the role field
  }
}
```

### 3. Database Constraints (Layer 3)

```prisma
model User {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  email         String   @unique  // Database enforces uniqueness
  password      String   // Hashed in Prisma extension
  role          ROLE     @default(USER)
  createdAt     DateTime @default(now())
  passwordResetToken   String?  // Managed internally
  passwordResetExpires DateTime?
}
```

---

## Quick Reference

### When to Use Each Layer

| Layer                 | When to Use                      | Example                                  |
| --------------------- | -------------------------------- | ---------------------------------------- |
| **1. Zod Schema**     | Always (primary defense)         | User can only update `name` and `email`  |
| **2. Service Filter** | Complex apps, role-based access  | Admins can update more fields than users |
| **3. DB Constraints** | Critical fields (id, timestamps) | `createdAt` never changes after creation |

### Decision Tree

```
Is this an external API endpoint?
├─ YES → MUST use Zod schema validation (Layer 1)
│        SHOULD use service filtering for defense in depth (Layer 2)
│
└─ NO (internal service call)
    └─ MUST use service filtering (Layer 2)
       OR ensure caller is trusted
```

---

## Common Patterns

### Pattern 1: Separate Schemas for Create vs Update

```typescript
// Create: Requires password
export const userCreateSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string(),
    })
    .strict(),
});

// Update: Password has separate endpoint
export const userUpdateSchema = z.object({
  body: z
    .object({
      email: z.string().email().optional(),
      name: z.string().optional(),
      // No password field!
    })
    .strict(),
});

// Password update: Requires old password
export const userUpdatePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
      confirmPassword: z.string(),
    })
    .strict(),
});
```

### Pattern 2: Conditional Field Filtering

```typescript
protected filterUpdateInput(
  input: ProductUpdateInput,
  userRole?: string
): ProductUpdateInput {
  const baseFields: (keyof ProductUpdateInput)[] = ['description', 'images'];

  const roleFieldMap = {
    USER: baseFields,
    MODERATOR: [...baseFields, 'featured'],
    ADMIN: [...baseFields, 'featured', 'price', 'category'],
  };

  const allowedFields = roleFieldMap[userRole || 'USER'];
  return this.pickFields(input, allowedFields);
}
```

### Pattern 3: Audit Trail for Sensitive Updates

```typescript
async update(id: string, input: UpdateInput) {
  const validatedInput = this.filterUpdateInput
    ? this.filterUpdateInput(input)
    : input;

  // Log what fields are being changed
  const changedFields = Object.keys(validatedInput);
  console.log(`Updating entity ${id}, fields: ${changedFields.join(', ')}`);

  const entity = await this.persistUpdate(id, validatedInput);
  if (!entity) throw new AppError("No document found with that ID", 404);

  return this.toDTO(entity);
}
```

---

## Testing Field Whitelisting

### Unit Test Example

```typescript
import { CategoryService } from "../services/category.service";

describe("CategoryService - Field Whitelisting", () => {
  it("should only update allowed fields", async () => {
    const service = new CategoryService();

    const maliciousInput = {
      name: "HEADPHONES",
      thumbnail: {
        /* valid data */
      },
      id: "hacker-id", // ❌ Should be filtered
      createdAt: new Date(), // ❌ Should be filtered
      v: 999, // ❌ Should be filtered
    };

    // Mock persistUpdate to capture what actually gets passed
    const spy = jest.spyOn(service as any, "persistUpdate");

    await service.update("existing-id", maliciousInput);

    expect(spy).toHaveBeenCalledWith("existing-id", {
      name: "HEADPHONES",
      thumbnail: expect.any(Object),
      // id, createdAt, v should NOT be here
    });
  });
});
```

### Integration Test Example

```typescript
describe("PATCH /api/categories/:id", () => {
  it("should reject extra fields in request body", async () => {
    const response = await request(app).patch("/api/categories/123").send({
      name: "SPEAKERS",
      hackerField: "evil", // ❌ Not in schema
    });

    expect(response.status).toBe(422); // Validation error
    expect(response.body.message).toContain("Unrecognized key");
  });

  it("should not allow updating id field", async () => {
    const response = await request(app).patch("/api/categories/123").send({
      id: "456", // ❌ Trying to change ID
      name: "SPEAKERS",
    });

    expect(response.status).toBe(422);
  });
});
```

---

## Summary Checklist

- [ ] **Define Zod schema** with only updateable fields + `.strict()`
- [ ] **Apply `validateSchema` middleware** in route definition
- [ ] **Implement `filterUpdateInput`** in service (optional but recommended)
- [ ] **Set appropriate Prisma constraints** (@default, @updatedAt, @id)
- [ ] **Write tests** for both allowed and rejected field updates
- [ ] **Document** which fields are updateable and why

---

## Further Reading

- [Zod Documentation - strict()](https://zod.dev/?id=strict)
- [VALIDATION_STRATEGY.md](./VALIDATION_STRATEGY.md) - Full validation guide
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
