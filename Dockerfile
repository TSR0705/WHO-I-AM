# Build stage: copy frontend into backend/public
FROM node:18-alpine AS builder
WORKDIR /app

# Copy backend and frontend
COPY backend/package.json ./backend/package.json
COPY backend/package-lock.json* ./backend/
COPY backend/index.js ./backend/
COPY backend/visits.json ./backend/
COPY frontend ./frontend

# No build step for frontend (static)

# Final image: run backend and serve frontend from /app/backend/public
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend ./backend/public

WORKDIR /app/backend
# Install production deps and a tiny HTTP client used by healthchecks
RUN apk add --no-cache curl && npm install --production

EXPOSE 3000
ENV NODE_ENV=production

# Create non-root user to run the app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

USER appuser

CMD ["npm", "start"]
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -fsS http://localhost:3000/healthz || exit 1
