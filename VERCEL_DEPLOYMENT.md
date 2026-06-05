# Vercel Deployment Guide

## Overview
This application is configured for deployment on Vercel with a monorepo structure containing:
- **Frontend**: Next.js application
- **Backend**: Express.js API server

## Prerequisites

1. **Vercel Account**: [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **External Services**:
   - **PostgreSQL Database**: Use Vercel Postgres, AWS RDS, Railway, or similar
   - **Redis** (optional): Use Upstash, Redis Cloud, or similar
   - **DNS Server**: Not supported on Vercel (runs locally only)

## Environment Variables Required

Set these in the Vercel dashboard under Project Settings → Environment Variables:

### Production
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://... (optional)
NODE_ENV=production
LOG_LEVEL=info
ALLOWED_ORIGIN=https://yourdomain.com
TRUST_PROXY=1
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
GEO_PROVIDER=geoip (optional)
GEO_API_KEY=... (optional)
```

## Deployment Steps

1. **Connect GitHub Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select "Continue with Existing Settings" (uses vercel.json)

2. **Set Environment Variables**
   - Add all required variables from the list above
   - Use Vercel Postgres or external database service

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy based on vercel.json

## Features

✅ **Supported on Vercel:**
- Frontend (Next.js) - Full support
- Backend (Express API) - Serverless functions
- Automatic HTTPS/SSL
- CDN for static assets
- Automatic deployments on git push

❌ **NOT Supported on Vercel:**
- DNS Server (UDP protocol)
- Long-running background jobs
- Direct file system writes

## API Routes

All API endpoints are available at `/api/`:
- `/api/whoami` - Get IP and fingerprint info
- `/api/visits` - Visit history
- `/api/fingerprint` - Fingerprint detection
- `/api/dns-leak` - DNS leak detection (limited on serverless)
- `/api/health` - Health check
- `/api/healthz` - Alternative health check
- `/api/metrics` - Prometheus metrics

## DNS Server

The DNS server (`dns-server.ts`) **only runs locally**. On Vercel, it's disabled via the `VERCEL` environment variable check.

To use DNS leak detection on Vercel:
- Set up a separate DNS server on another platform (VPS, Docker Cloud, etc.)
- Update the frontend to point to that external DNS server

## Monitoring

- **Vercel Dashboard**: Monitor builds, deployments, and analytics
- `/api/healthz` - Check backend health
- `/api/metrics` - Prometheus metrics for monitoring

## Troubleshooting

### Build Fails
- Check logs in Vercel dashboard
- Ensure all environment variables are set
- Verify package.json build scripts work locally

### Database Connection Fails
- Verify DATABASE_URL is correct
- Check database is accessible from Vercel's IP range
- Use Vercel Postgres for simplicity

### API Timeouts
- Default timeout: 10 seconds
- Pro plan: 60 seconds
- Optimize long-running operations

## Local Testing

Before deploying, test locally:
```bash
npm install
npm run build
npm run start
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Node.js on Vercel](https://vercel.com/docs/functions/serverless-functions/node-js)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
