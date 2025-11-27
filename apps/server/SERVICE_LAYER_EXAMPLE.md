# Service Layer Pattern

## What is a Service Layer?

The **Service Layer** sits between Controllers and the Database (Prisma), containing:

- Complex business logic
- Multi-step operations
- Cross-entity operations
- Reusable business functions
- Transaction management

## Architecture Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────┐
│     Router      │ ← Route definitions
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Middleware    │ ← validateSchema, auth
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Controller    │ ← HTTP concerns, request/response
└──────┬──────────┘
       │ calls service
       ▼
┌─────────────────┐
│    Service      │ ← Business logic, transactions
└──────┬──────────┘
       │ uses Prisma
       ▼
┌─────────────────┐
│ Prisma/Database │ ← Data access
└─────────────────┘
```

---

## When to Use Services

### ✅ Use Service Layer When:

1. **Multiple database operations** (transactions)
2. **Complex business logic** that doesn't fit in controller
3. **Reusable logic** across multiple controllers
4. **Cross-entity operations** (e.g., create order + update inventory)
5. **External API calls** combined with database operations
6. **Testing** - easier to unit test business logic

### ❌ Don't Use Service Layer When:

1. **Simple CRUD** - just read/write one entity
2. **Pass-through logic** - controller → Prisma, nothing else
3. **Over-engineering** - adds unnecessary complexity

---

## Example 1: Order Service (Complex Business Logic)

### File Structure

```
apps/server/src/
  ├── controllers/
  │   └── order.controller.ts
  ├── services/
  │   └── order.service.ts
  ├── routes/
  │   └── order.route.ts
  └── utils/
      └── appError.ts
```

### order.service.ts

```typescript
import { prisma } from "@repo/database";
import AppError from "../utils/appError.js";

export class OrderService {
  /**
   * Create order with inventory validation and stock reduction
   * This is a multi-step operation requiring a transaction
   */
  async createOrder(userId: string, orderData: CreateOrderInput) {
    // Use Prisma transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      // 1. Validate all products exist and have sufficient stock
      const productIds = orderData.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true, inventory: true, name: true },
      });

      if (products.length !== productIds.length) {
        throw new AppError("One or more products not found", 404);
      }

      // 2. Check inventory and calculate total
      let calculatedTotal = 0;
      const stockUpdates: { id: string; quantity: number }[] = [];

      for (const item of orderData.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new AppError(`Product ${item.productId} not found`, 404);
        }

        // Business rule: Check stock availability
        if (product.inventory < item.quantity) {
          throw new AppError(
            `Insufficient stock for ${product.name}. Available: ${product.inventory}, Requested: ${item.quantity}`,
            400
          );
        }

        calculatedTotal += product.price * item.quantity;
        stockUpdates.push({
          id: product.id,
          quantity: product.inventory - item.quantity,
        });
      }

      // 3. Validate total matches (prevent price tampering)
      if (Math.abs(calculatedTotal - orderData.total) > 0.01) {
        throw new AppError(
          `Total mismatch. Expected: ${calculatedTotal}, Received: ${orderData.total}`,
          400
        );
      }

      // 4. Create order
      const order = await tx.order.create({
        data: {
          userId,
          total: calculatedTotal,
          status: "PENDING",
          items: {
            create: orderData.items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price, // Lock price at order time
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      // 5. Update inventory for all products
      await Promise.all(
        stockUpdates.map((update) =>
          tx.product.update({
            where: { id: update.id },
            data: { inventory: update.quantity },
          })
        )
      );

      return order;
    });
  }

  /**
   * Cancel order and restore inventory
   */
  async cancelOrder(orderId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get order with items
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      // 2. Authorization check
      if (order.userId !== userId) {
        throw new AppError("Not authorized to cancel this order", 403);
      }

      // 3. Business rule: Can only cancel pending/processing orders
      if (!["PENDING", "PROCESSING"].includes(order.status)) {
        throw new AppError(
          `Cannot cancel order with status: ${order.status}`,
          400
        );
      }

      // 4. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
        include: { items: true },
      });

      // 5. Restore inventory
      await Promise.all(
        order.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { inventory: { increment: item.quantity } },
          })
        )
      );

      return updatedOrder;
    });
  }

  /**
   * Get user's orders with filtering and pagination
   */
  async getUserOrders(
    userId: string,
    options: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(options.status && { status: options.status }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

// Export singleton instance
export const orderService = new OrderService();

// Types
type CreateOrderInput = {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  total: number;
};
```

### order.controller.ts

```typescript
import { RequestHandler } from "express";
import catchAsync from "../utils/catchAsync.js";
import { orderService } from "../services/order.service.js";

export const createOrder: RequestHandler = catchAsync(async (req, res) => {
  // Controller only handles HTTP concerns
  const order = await orderService.createOrder(req.user.id, req.body);

  res.status(201).json({
    status: "success",
    data: order,
  });
});

export const cancelOrder: RequestHandler = catchAsync(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user.id);

  res.status(200).json({
    status: "success",
    data: order,
  });
});

export const getUserOrders: RequestHandler = catchAsync(async (req, res) => {
  const result = await orderService.getUserOrders(req.user.id, {
    status: req.query.status as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });

  res.status(200).json({
    status: "success",
    data: result.orders,
    pagination: result.pagination,
  });
});
```

### order.route.ts

```typescript
import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import { CreateOrderSchema, GetOrdersQuerySchema } from "@repo/domain";

const router = express.Router();

// All order routes require authentication
router.use(protect);

router
  .route("/")
  .get(validateSchema(GetOrdersQuerySchema), orderController.getUserOrders)
  .post(validateSchema(CreateOrderSchema), orderController.createOrder);

router.route("/:id/cancel").patch(orderController.cancelOrder);

export default router;
```

---

## Example 2: User Service (Reusable Logic)

### user.service.ts

```typescript
import { prisma } from "@repo/database";
import AppError from "../utils/appError.js";
import jwt from "jsonwebtoken";
import { env } from "../utils/env.js";

export class UserService {
  /**
   * Register new user
   * Handles validation, creation, and token generation
   */
  async register(userData: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }

    // Create user (password hashing happens in Prisma extension)
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.passwordConfirm,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  /**
   * Login user
   */
  async login(credentials: LoginInput) {
    // Find user and explicitly select password (normally omitted)
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true, // Need password for validation
        active: true,
      },
    });

    if (!user || !user.active) {
      throw new AppError("Invalid credentials", 401);
    }

    // Validate password using Prisma extension method
    const isPasswordValid = await prisma.user.validatePassword(
      credentials.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    // Remove password from returned user
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = this.generateToken(user.id);

    return { user: userWithoutPassword, token };
  }

  /**
   * Update user password
   */
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isValid = await prisma.user.validatePassword(
      currentPassword,
      user.password
    );

    if (!isValid) {
      throw new AppError("Current password is incorrect", 401);
    }

    // Update password (hashing happens in Prisma extension)
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: newPassword,
        passwordConfirm: newPassword,
      },
    });

    return { message: "Password updated successfully" };
  }

  /**
   * Get user profile with statistics
   */
  async getUserProfile(userId: string) {
    const [user, orderCount, totalSpent] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
      }),
      prisma.order.count({
        where: { userId },
      }),
      prisma.order.aggregate({
        where: { userId, status: "COMPLETED" },
        _sum: { total: true },
      }),
    ]);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      ...user,
      stats: {
        orderCount,
        totalSpent: totalSpent._sum.total || 0,
      },
    };
  }

  /**
   * Reusable helper: Generate JWT token
   */
  private generateToken(userId: string): string {
    return jwt.sign({ id: userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN || "7d",
    });
  }

  /**
   * Reusable helper: Verify JWT token
   */
  verifyToken(token: string): { id: string } {
    try {
      return jwt.verify(token, env.JWT_SECRET) as { id: string };
    } catch (error) {
      throw new AppError("Invalid or expired token", 401);
    }
  }
}

export const userService = new UserService();

// Types
type RegisterInput = {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

type LoginInput = {
  email: string;
  password: string;
};
```

---

## Example 3: Product Service (External API Integration)

### product.service.ts

```typescript
import { prisma } from "@repo/database";
import AppError from "../utils/appError.js";
import axios from "axios";
import { env } from "../utils/env.js";

export class ProductService {
  /**
   * Create product with image upload to Cloudinary
   */
  async createProduct(productData: CreateProductInput) {
    // Upload images to Cloudinary (external service)
    const uploadedImages = await this.uploadImagesToCloudinary(
      productData.images
    );

    // Create product with uploaded image URLs
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.slug,
        price: productData.price,
        description: productData.description,
        categoryId: productData.categoryId,
        inventory: productData.inventory,
        images: {
          create: uploadedImages.map((img) => ({
            url: img.url,
            publicId: img.publicId,
            altText: productData.name,
          })),
        },
      },
      include: {
        images: true,
        category: true,
      },
    });

    return product;
  }

  /**
   * Delete product and cleanup images from Cloudinary
   */
  async deleteProduct(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Delete from database
    await prisma.product.delete({
      where: { id: productId },
    });

    // Delete images from Cloudinary (background task)
    this.deleteImagesFromCloudinary(product.images.map((img) => img.publicId));

    return { message: "Product deleted successfully" };
  }

  /**
   * Sync product prices with external pricing API
   */
  async syncPricesWithExternalAPI() {
    try {
      // Fetch latest prices from external API
      const response = await axios.get(`${env.PRICING_API_URL}/prices`, {
        headers: { Authorization: `Bearer ${env.PRICING_API_KEY}` },
      });

      const externalPrices = response.data;

      // Update products in transaction
      await prisma.$transaction(
        externalPrices.map((item: { sku: string; price: number }) =>
          prisma.product.updateMany({
            where: { sku: item.sku },
            data: { price: item.price },
          })
        )
      );

      return {
        message: `Successfully synced ${externalPrices.length} products`,
      };
    } catch (error) {
      throw new AppError("Failed to sync prices from external API", 502);
    }
  }

  /**
   * Private helper: Upload images to Cloudinary
   */
  private async uploadImagesToCloudinary(images: string[]) {
    // This would use cloudinary SDK in real implementation
    const uploads = await Promise.all(
      images.map(async (base64Image) => {
        // Simulate upload
        return {
          url: "https://cloudinary.com/uploaded-image.jpg",
          publicId: "product-images/abc123",
        };
      })
    );

    return uploads;
  }

  /**
   * Private helper: Delete images from Cloudinary
   */
  private async deleteImagesFromCloudinary(publicIds: string[]) {
    // Fire and forget - don't block response
    Promise.all(
      publicIds.map(async (publicId) => {
        // Delete from cloudinary
      })
    ).catch((error) => {
      console.error("Failed to delete images from Cloudinary", error);
    });
  }
}

export const productService = new ProductService();

type CreateProductInput = {
  name: string;
  slug: string;
  price: number;
  description: string;
  categoryId: string;
  inventory: number;
  images: string[]; // base64 encoded
};
```

---

## Testing Services

### order.service.test.ts

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { OrderService } from "./order.service";
import { prisma } from "@repo/database";

// Mock Prisma
vi.mock("@repo/database", () => ({
  prisma: {
    $transaction: vi.fn(),
    product: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("OrderService", () => {
  let service: OrderService;

  beforeEach(() => {
    service = new OrderService();
    vi.clearAllMocks();
  });

  describe("createOrder", () => {
    it("should create order and reduce inventory", async () => {
      const mockProducts = [
        { id: "1", price: 100, inventory: 10, name: "Product 1" },
      ];

      const orderData = {
        items: [{ productId: "1", quantity: 2 }],
        total: 200,
      };

      // Mock transaction
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findMany: vi.fn().mockResolvedValue(mockProducts),
            update: vi.fn(),
          },
          order: {
            create: vi.fn().mockResolvedValue({
              id: "order-1",
              total: 200,
              items: [],
            }),
          },
        });
      });

      const result = await service.createOrder("user-1", orderData);

      expect(result).toBeDefined();
      expect(result.total).toBe(200);
    });

    it("should throw error if insufficient stock", async () => {
      const mockProducts = [
        { id: "1", price: 100, inventory: 1, name: "Product 1" },
      ];

      const orderData = {
        items: [{ productId: "1", quantity: 5 }],
        total: 500,
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findMany: vi.fn().mockResolvedValue(mockProducts),
          },
        });
      });

      await expect(service.createOrder("user-1", orderData)).rejects.toThrow(
        "Insufficient stock"
      );
    });
  });
});
```

---

## Service Layer Best Practices

### ✅ DO:

1. **Keep services focused** - One service per domain entity
2. **Use dependency injection** - Pass prisma as parameter if needed
3. **Return domain objects** - Not HTTP responses
4. **Throw AppError** - Let controller handle HTTP status
5. **Use transactions** - For multi-step operations
6. **Make reusable** - Methods should be called from multiple controllers
7. **Test independently** - Mock Prisma, test business logic

### ❌ DON'T:

1. **Access req/res** - Services should be HTTP-agnostic
2. **Return HTTP responses** - Return data, let controller format response
3. **Handle validation** - That's middleware's job
4. **Mix concerns** - Keep services focused on one domain
5. **Make God services** - Don't put everything in one service

---

## When to Skip Service Layer

```typescript
// Simple CRUD - NO service needed
export const getProductById: RequestHandler = catchAsync(async (req, res) => {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: req.params.id },
  });

  res.status(200).json({
    status: "success",
    data: product,
  });
});

// Complex logic - USE service
export const createOrder: RequestHandler = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);

  res.status(201).json({
    status: "success",
    data: order,
  });
});
```

---

## Summary

| Scenario              | Use Service? | Why                             |
| --------------------- | ------------ | ------------------------------- |
| Simple CRUD           | ❌ No        | Controller → Prisma is enough   |
| Multi-step operations | ✅ Yes       | Transactions, complexity        |
| Business logic        | ✅ Yes       | Reusability, testability        |
| External API calls    | ✅ Yes       | Separation of concerns          |
| Authorization checks  | ⚠️ Maybe     | Can be in controller or service |
| Data formatting       | ❌ No        | That's controller's job         |

**Rule of thumb**: If your controller method has more than 10 lines of business logic, consider a service.
