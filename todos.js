// ============================================================================
// SERVER & API
// ============================================================================
// TODO and prod url to postman collection

// TODOs collected from server app
// File: /Users/talbendet/Projects/monorepo/audiophile-ecommerce-v5/apps/server/src/services/product.service.ts
// Line: 20
// Context: tune DTO and filter types as needed
// TODO: tune DTO and filter types as needed

// File: /Users/talbendet/Projects/monorepo/audiophile-ecommerce-v5/apps/server/src/services/product.service.ts
// Line: 224
// Context: aggregate to reduce queries
// TODO: aggregate to reduce queries

// File: /Users/talbendet/Projects/monorepo/audiophile-ecommerce-v5/apps/server/src/controllers/config.controller.ts
// Line: 10
// Context: consider adding config id to env variables for easy access
// TODO: consider adding config id to env variables for easy access

// TODOs collected from server app
// File: /Users/talbendet/Projects/monorepo/audiophile-ecommerce-v5/apps/server/src/services/product.service.ts
// Line: 20
// Context: tune DTO and filter types as needed
// TODO: tune DTO and filter types as needed

// File: /Users/talbendet/Projects/monorepo/audiophile-ecommerce-v5/apps/server/src/services/product.service.ts
// Line: 224
// Context: aggregate to reduce queries
// TODO: aggregate to reduce queries

// TODO implement forgot password and reset password
// TODO switch to cloudinary upload images and products from dashboard? url or image upload
// TODO add errors for update same value
// TODO checkout prices should return from backend
// TODO handle slugs ,where is generated create update, user provide??
// TODO add rate limiting middleware to server
// TODO add helmet middleware to server

// ============================================================================
// ERROR HANDLING & VALIDATION
// ============================================================================

// TODO improve abstract-crud-service typing ,constraints on Where, Select to match Entity structure
//      Location: apps/server/src/services/abstract-crud.service.ts
//      Context: Generic types Where, Select are currently unconstrained (any)
//      Goal: Constrain Where, Select to match Entity structure for better type safety
//      Considerations:
//        - Use mapped types or conditional types to derive Where, Select from Entity
//        - Ensure compatibility with Prisma's filtering and selection capabilities
//      Benefits: Improved type safety, better developer experience with autocompletion and error checking

// location: packages/domain/src/error-codes.ts
// TODO add validation error codes for different scenarios (e.g. invalid input, missing fields, etc.) 400 422

// ============================================================================
// DATABASE & MODELS
// ============================================================================

// TODO Consider removing NAME enum from Category schema
// TODO refactor category prisma with products relation ,add cascade delete
//      Current: name is NAME enum (Headphones|Earphones|Speakers)
//      Problem: Can't create new categories at runtime without schema migration + deploy
//      Recommendation: Change to name: String, slug: String @unique
//      Impact: More flexible content management, better i18n support, admin can add categories
//      Trade-off: Lose compile-time type safety for category names

// TODO Prisma optional field syntax: field? Type vs field Type?
//      Location: packages/database/prisma/schema/
//      Context: Optional fields in Prisma nested types can be declared two ways
//      Option 1: showCaseImage? ProductImagesProperties
//        - Field is optional (can be omitted entirely)
//        - Cleaner JSON, no null values in payload
//        - Better for optional images (featured, showcase, etc.)
//      Option 2: showCaseImage ProductImagesProperties?
//        - Field is required but can have null value
//        - Always include key, even if null
//      Recommendation: Use Option 1 (field?) for image types since not all products have all images
//      Current: Mix of both approaches in ProductImages type (should standardize)
// TODO add null values to product seed/? check which values are null by default

// ============================================================================
// DATA & SEEDING
// ============================================================================

// TODO isNew as a virtual property - less than a year since arrival

// ============================================================================
// CODE ORGANIZATION & QUALITY
// ============================================================================
// TODO refactor abstract-crud-service to use ExtendedQueryParams from common.ts
// TODO improve typing in abstract-crud-service methods (Where, Select, etc.)
// TODO create querybuilder utility to handle filtering, sorting, pagination, field selection
// ============================================================================
// LEARNING & DOCUMENTATION
// ============================================================================

// TODO jsdoc comments for all service methods
