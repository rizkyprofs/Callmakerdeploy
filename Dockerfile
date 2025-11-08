# Dockerfile untuk CallMaker App
FROM node:20-alpine AS base

# Build Frontend
FROM base AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build Backend
FROM base AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Final Stage
FROM node:20-alpine
WORKDIR /app

# Install MySQL Client untuk wait-for-db
RUN apk add --no-cache mysql-client

# Copy backend
COPY --from=backend-build /app/backend /app/backend
# Copy frontend build results
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Copy database initialization script
COPY callmaker_db.sql /docker-entrypoint-initdb.d/

# Create startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/backend
EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]