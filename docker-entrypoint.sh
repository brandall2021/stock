#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "→ DATABASE_URL no definida, usando file:/data/stock.db"
  export DATABASE_URL="file:/data/stock.db"
fi

echo "→ Aplicando esquema de base de datos (prisma db push)"
npx prisma db push --skip-generate

echo "→ Ejecutando seed (idempotente, crea usuarios de prueba)"
node prisma/seed.mjs

echo "→ Iniciando aplicación"
exec "$@"
