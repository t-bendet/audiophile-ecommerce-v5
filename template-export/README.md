# Monorepo Template

A production-ready monorepo template with React 19, React Router 7, Express 5, Prisma, MongoDB, and TypeScript. Demonstrates core connected functionality: authentication and navigation with categories and cart.

## Tech Stack (Locked)

### Frontend
- **React 19.1** + **React Router 7.11** + **Vite 7**
- **TanStack Query** (React Query) + **TanStack Form**
- **Axios** for HTTP requests
- **Tailwind CSS 4** + **Radix UI** + **Lucide Icons**
- **Zod 4** for validation
- **TypeScript 5.9**

### Backend
- **Node.js 24.5.0** (required)
- **Express 5.1** REST API
- **Prisma 6.19** with **MongoDB**
- **JWT** authentication
- **Zod 4** for validation
- **Helmet**, **Rate Limit**, **CORS**, **Morgan**
- **TypeScript 5.9**

### Monorepo Tools
- **Turborepo 2.6** for task orchestration
- **pnpm 10.30** workspaces
- **TypeScript** project references

## Core Connected Features

✅ **Auth End-to-End**
- Signup and login forms
- JWT-based authentication (cookies + headers)
- Protected routes and endpoints
- Session management with logout

✅ **Navbar Data End-to-End**
- Categories list (public API)
- Cart badge with item count
- User dropdown (anonymous vs logged-in states)
- Graceful fallbacks when unauthenticated

## Prerequisites

- **Node.js 24.5.0+** (required by package engines)
- **pnpm 10.30.0** (install with `npm install -g pnpm@10.30.0`)
- **MongoDB** (local or MongoDB Atlas)

## Quick Start

### 1. Clone and Install

\`\`\`bash
# Clone this template
git clone <your-repo-url> my-app
cd my-app

# Install dependencies
pnpm install
\`\`\`

### 2. Environment Setup

Create `.env` files from examples:

\`\`\`bash
# Database environment
cp packages/database/.env.example packages/database/.env

# Server environment  
cp apps/server/.env.example apps/server/.env

# Client environment (optional, has defaults)
cp apps/client/.env.example apps/client/.env
\`\`\`

**Edit `packages/database/.env`:**
\`\`\`env
DATABASE_URL=mongodb://localhost:27017/template_db
# OR for MongoDB Atlas:
# DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/database?retryWrites=true&w=majority
\`\`\`

**Edit `apps/server/.env`:**
\`\`\`env
DATABASE_URL=mongodb://localhost:27017/template_db
JWT_SECRET=CHANGE_THIS_TO_AT_LEAST_32_RANDOM_CHARACTERS
\`\`\`

⚠️ **Important:** Change `JWT_SECRET` to a strong random string (minimum 32 characters) for production.

### 3. Database Setup

\`\`\`bash
# Generate Prisma client (includes custom post-processing for ESM)
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed sample data (optional)
pnpm db:seed
\`\`\`

### 4. Development

\`\`\`bash
# Start all apps (client + server)
pnpm dev

# OR start individually:
pnpm dev:client  # http://localhost:5173
pnpm dev:server  # http://localhost:8000
\`\`\`

Visit http://localhost:5173 to see the app.

### 5. Build

\`\`\`bash
# Build all packages and apps
pnpm build

# Production server
pnpm prod:server

# Preview client build
pnpm prod:client
\`\`\`

## Project Structure

\`\`\`
├── apps/
│   ├── client/          # React 19 + React Router 7 + Vite
│   └── server/          # Express 5 REST API
├── packages/
│   ├── database/        # Prisma client + schema + seeds
│   ├── domain/          # Shared types, Zod schemas, DTOs
│   ├── config-eslint/   # ESLint configurations
│   └── config-typescript/ # TypeScript base configs
├── smoke-test.mjs       # Basic connectivity tests
└── turbo.json           # Turborepo pipeline config
\`\`\`

## Available Scripts

### Root Commands
\`\`\`bash
pnpm dev              # Start all apps in parallel
pnpm dev:client       # Start client only
pnpm dev:server       # Start server only
pnpm build            # Build all packages + apps
pnpm types:watch      # TypeScript watch mode (all projects)
pnpm lint             # Lint all packages
pnpm smoke            # Run smoke tests
\`\`\`

### Database Commands
\`\`\`bash
pnpm db:generate      # Generate Prisma client + post-process
pnpm db:push          # Push schema to database
pnpm db:seed          # Seed sample data
\`\`\`

## API Endpoints

### Public Endpoints
- `GET /api/v1/health` - Health check
- `POST /api/v1/auth/signup` - Create account
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/status` - Check auth status
- `GET /api/v1/categories` - List categories

### Protected Endpoints (require auth)
- `POST /api/v1/auth/logout` - Logout
- `PATCH /api/v1/auth/updateMyPassword` - Update password
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart` - Add to cart
- `PATCH /api/v1/cart/items/:id` - Update cart item
- `DELETE /api/v1/cart/items/:id` - Remove from cart
- `DELETE /api/v1/cart` - Clear cart

## Creating a New Project from Template

1. **Clone and rename:**
   \`\`\`bash
   git clone <template-repo> my-project
   cd my-project
   rm -rf .git
   git init
   \`\`\`

2. **Update branding:**
   - Change `name` in root `package.json`
   - Update `title` in `apps/client/index.html`
   - Update home page content in `apps/client/src/app/routes/home/index.tsx`

3. **Update environment variables:**
   - Copy all `.env.example` files to `.env`
   - Generate new `JWT_SECRET` (minimum 32 characters)
   - Set your `DATABASE_URL` (MongoDB connection string)

4. **Install and setup:**
   \`\`\`bash
   pnpm install
   pnpm db:generate
   pnpm db:push
   pnpm db:seed  # optional
   \`\`\`

5. **Verify everything works:**
   \`\`\`bash
   pnpm dev
   pnpm smoke  # (in another terminal)
   \`\`\`

## MongoDB Setup

### Local MongoDB
\`\`\`bash
# macOS (Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt install mongodb
sudo systemctl start mongodb
\`\`\`

### MongoDB Atlas (Cloud)
1. Create free cluster at https://www.mongodb.com/atlas
2. Create database user with read/write access
3. Whitelist your IP (or use `0.0.0.0/0` for development)
4. Copy connection string to `.env` files

## License

MIT

## Credits

Template created from audiophile-ecommerce-v5 project.
