# Frontend production image — build the Next.js app then serve it with `next start`.
# Build context is ./frontend. NEXT_PUBLIC_API_URL is baked at build time
# (client bundle), so it must be passed as a build arg.
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runtime image ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

EXPOSE 3000
CMD ["npm", "run", "start"]
