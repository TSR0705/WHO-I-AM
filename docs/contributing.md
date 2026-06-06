# WHO-I-AM: Contributor Guide

Welcome! This guide outlines the development workflow, testing guidelines, and code patterns for contributing to WHO-I-AM.

---

## 1. Onboarding Dev Workflow

### Prerequisite Checklist
* **Node.js**: v18.0.0+ (LTS recommended).
* **Package Manager**: npm (monorepo workspaces are pre-configured).
* **Editor**: VS Code (recommended).

### Sandbox Installation
1. Fork and clone the repository.
2. Initialize workspaces dependencies:
   ```bash
   npm install
   ```
3. Run the database downloaders and CIDR compilers to populate the offline data maps:
   ```bash
   # Download and compress databases
   node apps/backend/scripts/download-db.js --force
   # Compile subnets
   npx ts-node apps/backend/scripts/compile-infra.ts --force
   # Compile Tor exit nodes
   npx ts-node apps/backend/scripts/compile-tor.ts --force
   ```
4. Start local development hot-reload servers:
   ```bash
   npm run dev
   ```

---

## 2. Testing Guidelines

We utilize **Jest** for backend and service level testing. Tests verify the integrity of decompilation, subnet matching boundary states, and mock payloads.

### Execute Tests
Run all test suites across the monorepo:
```bash
npm run test --workspace=whoami-backend
```

### Adding Unit Tests
All unit tests reside in `apps/backend/src/__tests__/`. When writing new intelligence or helper functions, add a matching `.test.ts` file.

---

## 3. Extending the Backend

### How to Add a New API Route
1. Create a new route file under `apps/backend/src/routes/` (e.g., `audit-logger.ts`):
   ```typescript
   import { Router, Request, Response } from 'express';
   const router = Router();
   router.get('/audit-log', (req: Request, res: Response) => {
     res.json({ logs: [] });
   });
   export default router;
   ```
2. Mount the new router in `apps/backend/src/index.ts`:
   ```typescript
   import auditLoggerRouter from './routes/audit-logger';
   // ...
   app.use('/api', auditLoggerRouter);
   ```

### How to Add a New Intelligence Service
1. Place the service logic under `apps/backend/src/services/` (e.g., `dns-sec.ts`).
2. Integrate the service into `/api/whoami` to append findings to the main diagnostic response.

---

## 4. Extending the Frontend

### How to Add a New Audit Category
1. Create a detailed audit panel component under `apps/frontend/src/app/components/categories/` (e.g., `VpnLeakPanel.tsx`).
2. Register the category metadata in the `testCategories` array inside `apps/frontend/src/app/hooks/useAuditPipeline.ts`:
   ```typescript
   export const testCategories = [
     // ...
     { id: 8, name: "VPN Tunnel Integrity Test", desc: "Verifying encrypted tunnel headers" }
   ];
   ```
3. Update the scan loop logic inside `triggerAuditPipeline()` in `useAuditPipeline.ts` to execute your client-side checks when `activeCategoryIndex === 8`.
4. Render your component inside `apps/frontend/src/app/dashboard/page.tsx` within the category card grid.
