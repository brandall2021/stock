# ---- Stage de compilación ----
FROM node:22-alpine AS builder
WORKDIR /app

# Dependencias primero (mejor caché de build)
# Fallback a `npm install` porque el lock generado en Windows no trae los
# binarios opcionales de Linux (ej. @img/sharp-*) y `npm ci` falla con EUSAGE.
COPY package.json package-lock.json ./
RUN npm ci || npm install

# Generar cliente Prisma durante el build
COPY prisma ./prisma
RUN npx prisma generate

# Código fuente y build de Next.js
COPY . .
RUN npm run build

# ---- Stage de ejecución ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
