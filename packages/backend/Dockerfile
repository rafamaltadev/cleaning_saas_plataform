FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace files
COPY package*.json ./
# Copy backend package.json
COPY packages/backend/package.json ./packages/backend/

# Install all dependencies using workspace
RUN npm ci --workspace=packages/backend

# Copy backend source
COPY packages/backend ./packages/backend

# Build
WORKDIR /app/packages/backend
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY packages/backend/package.json ./packages/backend/

# Install production dependencies only
RUN npm ci --workspace=packages/backend --omit=dev

# Copy built output
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

WORKDIR /app/packages/backend
EXPOSE 3000
CMD ["node", "dist/main"]
