# Build stage
FROM oven/bun:1 AS builder

# Set build arguments
ARG BETTER_AUTH_SECRET
ARG RESEND_API_KEY
ARG RESEND_FROM_EMAIL
ARG DATABASE_URL

# Set environment variables for build
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV RESEND_FROM_EMAIL=$RESEND_FROM_EMAIL
ENV DATABASE_URL=$DATABASE_URL

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Install lightningcss for Linux
RUN bun add -D lightningcss-linux-x64-gnu

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]