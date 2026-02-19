# Error Flow in Server Application

## Development Mode Error Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REQUEST ENTERS                              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Route Handler         │
                    │  (wrapped in catchAsync)│
                    └────────┬───────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
           ✅ SUCCESS                  ❌ ERROR
                │                         │
                ▼                         ▼
         ┌─────────────┐       ┌──────────────────────┐
         │ Send Response│       │ catchAsync catches    │
         │    200-299   │       │ Promise rejection    │
         └─────────────┘       └──────┬───────────────┘
                                      │
                                      │ next(err)
                                      ▼
                         ┌──────────────────────────┐
                         │ Error Middleware         │
                         │ error.middleware.ts      │
                         └──────┬───────────────────┘
                                │
                                │ NODE_ENV === 'development'
                                ▼
                         ┌──────────────────────────┐
                         │   sendErrorDev()         │
                         │                          │
                         │  Returns FULL error:     │
                         │  ✓ status                │
                         │  ✓ error object          │
                         │  ✓ message               │
                         │  ✓ stack trace           │
                         │  ✓ statusCode            │
                         └──────┬───────────────────┘
                                │
                                ▼
                         ┌──────────────────────────┐
                         │  Response to Client      │
                         │  Status: err.statusCode  │
                         │  or 500                  │
                         └──────────────────────────┘
```

---

## Production Mode Error Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REQUEST ENTERS                              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Validation Middleware │
                    │  validateSchema()      │
                    └────────┬───────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
           ✅ VALID                   ❌ INVALID
                │                         │
                │                         ▼
                │              ┌─────────────────────────┐
                │              │ ZodError detected       │
                │              │ Create AppError(422)    │
                │              │ next(appError)          │
                │              └──────┬──────────────────┘
                │                     │
                ▼                     │
    ┌────────────────────┐           │
    │  Route Handler     │           │
    │ (catchAsync)       │           │
    └────────┬───────────┘           │
             │                        │
    ┌────────┴────────┐              │
    │                 │              │
✅ SUCCESS        ❌ ERROR            │
    │                 │              │
    ▼                 ▼              │
┌─────────┐   ┌───────────────┐     │
│Response │   │ catchAsync    │     │
│200-299  │   │ catches error │     │
└─────────┘   └───────┬───────┘     │
                      │             │
                      │ next(err)   │
                      ▼             │
         ┌────────────────────────┐ │
         │  Error Middleware      │◄┘
         │  error.middleware.ts   │
         └────────┬───────────────┘
                  │
                  │ NODE_ENV === 'production'
                  ▼
         ┌────────────────────────┐
         │  Error Type Detection  │
         │  (Type Guards)         │
         └────────┬───────────────┘
                  │
    ┌─────────────┼─────────────┬──────────────┬─────────────┬──────────────┐
    │             │             │              │             │              │
    ▼             ▼             ▼              ▼             ▼              ▼
┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│ZodError │  │ Prisma  │  │ Prisma   │  │   JWT    │  │AppError │  │ Unknown  │
│         │  │ Known   │  │Validation│  │  Error   │  │         │  │  Error   │
└────┬────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬────┘  └────┬─────┘
     │            │             │             │             │             │
     ▼            ▼             ▼             ▼             ▼             │
┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐       │
│ handle  │  │P2023:   │  │ handle   │  │Expired:  │  │  Pass   │       │
│ZodError │  │Cast 400 │  │Validation│  │  401     │  │ through │       │
│ 400     │  │P2002:   │  │Error 422 │  │Invalid:  │  │         │       │
│         │  │Dup. 400 │  │          │  │  401     │  │         │       │
│         │  │P2025:   │  │          │  │          │  │         │       │
│         │  │Missing  │  │          │  │          │  │         │       │
│         │  │404      │  │          │  │          │  │         │       │
└────┬────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬────┘       │
     │            │             │             │             │             │
     └────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
                                      │
                                      ▼
                            ┌──────────────────────┐
                            │  sendErrorProd()     │
                            └──────┬───────────────┘
                                   │
                      ┌────────────┴────────────┐
                      │                         │
                      ▼                         ▼
          ┌──────────────────────┐   ┌──────────────────────┐
          │ AppError             │   │ Unknown/Programming  │
          │ (isOperational=true) │   │ Error                │
          ├──────────────────────┤   ├──────────────────────┤
          │ Return:              │   │ Log to console       │
          │ ✓ status             │   │ Return:              │
          │ ✓ message            │   │ ✓ status: "error"    │
          │ ✓ statusCode         │   │ ✓ message: "Something│
          │                      │   │   went very wrong!"  │
          │ ❌ NO stack trace    │   │ ✓ statusCode: 500    │
          │ ❌ NO error details  │   │                      │
          │                      │   │ ❌ NO stack trace    │
          │                      │   │ ❌ NO error details  │
          └──────────────────────┘   └──────────────────────┘
```

---

## Error Types & Status Codes

### Validation Errors
| Error Type | Handler | Status | Message Format |
|------------|---------|--------|----------------|
| ZodError (middleware) | validateSchema → AppError | 422 | "Unprocessable Content. The following variables are missing or invalid: {details}" |
| ZodError (global) | handleZodError | 400 | "Unprocessable Content. The following variables are missing or invalid: {details}" |

### Database Errors (Prisma)
| Error Code | Handler | Status | Message |
|------------|---------|--------|---------|
| P2023 | handleCastErrorDB | 400 | "{err.meta.message}" |
| P2002 | handleDuplicateFieldsDB | 400 | "Duplicate field value: {target}. Please use another value!" |
| P2025 | handleMissingDocumentDB | 404 | "No matching {modelName} was found" |
| PrismaClientValidationError | handleValidationErrorDB | 422 | "Invalid query data. - Unprocessable Content" |

### Authentication Errors (JWT)
| Error Name | Handler | Status | Message |
|------------|---------|--------|---------|
| JsonWebTokenError | handleJWTError | 401 | "Invalid token. Please log in again!" |
| TokenExpiredError | handleJWTExpiredError | 401 | "Your token has expired! Please log in again." |

### Application Errors
| Type | Status | Operational | Description |
|------|--------|-------------|-------------|
| AppError | Custom (400-599) | true | Intentional errors thrown by app logic |
| Unknown Error | 500 | false | Programming errors, unexpected exceptions |

---

## Key Components

### 1. catchAsync (utils/catchAsync.ts)
```typescript
// Wraps async route handlers to catch Promise rejections
// Passes errors to next() → error middleware
```

### 2. validateSchema (middlewares/validation.middleware.ts)
```typescript
// Validates req.params, req.body, req.query against Zod schema
// On failure: Creates AppError(422) and calls next(appError)
// On success: Calls next() to continue to route handler
```

### 3. Error Middleware (middlewares/error.middleware.ts)
```typescript
// Central error handling with 4 parameters: (err, req, res, next)
// Branches based on NODE_ENV
```

### 4. AppError (utils/appError.ts)
```typescript
// Custom error class with:
// - statusCode (HTTP status)
// - status ("fail" for 4xx, "error" for 5xx)
// - isOperational (true for expected errors)
```

---

## Error Flow Decision Tree

```
Error Occurs
    │
    ├─ Development?
    │   └─ YES → sendErrorDev() → Full details to client
    │
    └─ Production?
        └─ YES → Check error type
            │
            ├─ ZodError? → handleZodError(400)
            ├─ Prisma P2023? → handleCastErrorDB(400)
            ├─ Prisma P2002? → handleDuplicateFieldsDB(400)
            ├─ Prisma P2025? → handleMissingDocumentDB(404)
            ├─ PrismaValidation? → handleValidationErrorDB(422)
            ├─ JWT Expired? → handleJWTExpiredError(401)
            ├─ JWT Invalid? → handleJWTError(401)
            ├─ AppError? → Pass through (already formatted)
            └─ Unknown? → Generic 500 error
                │
                └─ sendErrorProd()
                    │
                    ├─ isOperational? → Send error.message
                    └─ NOT operational? → "Something went very wrong!"
```

---

## Security Notes

✅ **Development**: Full error details help debugging
❌ **Production**: Hide implementation details to prevent information leakage

**Operational Errors** (expected, safe to show):
- Validation failures
- Missing resources (404)
- Duplicate entries
- Authentication failures

**Non-Operational Errors** (unexpected, hide details):
- Syntax errors
- Undefined references
- Database connection failures
- Any programming bugs
