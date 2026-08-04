#!/bin/sh
set -e

echo "→ Aplicando esquema de base de datos (prisma db push)"
npx prisma db push --skip-generate

echo "→ Iniciando aplicación"
exec "$@"
