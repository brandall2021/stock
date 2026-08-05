#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "→ DATABASE_URL no definida, construyendo desde variables DB_*"
  export DATABASE_URL="postgresql://${DB_USER:-brandall}:${DB_PASSWORD}@${DB_HOST:-basededato-6cfbai}:${DB_PORT:-5432}/${DB_NAME:-stock}"
fi

echo "→ Aplicando esquema de base de datos (prisma db push)"
npx prisma db push --skip-generate

echo "→ Ejecutando seed (idempotente, crea usuarios de prueba)"
node prisma/seed.mjs

echo "→ Importando catálogo de áreas (idempotente)"
node prisma/import-areas.mjs

echo "→ Importando inventario de librería (idempotente)"
node prisma/import-inventario.mjs

echo "→ Iniciando aplicación"
exec "$@"
