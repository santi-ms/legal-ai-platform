#!/bin/bash
# Script para generar diff entre la base de datos real y el schema.prisma
# Uso: ./scripts/generate-migration-diff.sh

set -e

SCHEMA_PATH="../../packages/db/prisma/schema.prisma"

echo "🔍 Generando diff entre base de datos y schema.prisma..."
echo "📋 Schema path: $SCHEMA_PATH"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL no está configurado"
  echo "   Configura DATABASE_URL antes de ejecutar este script"
  exit 1
fi

# Generar diff
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel "$SCHEMA_PATH" \
  --script > migration-diff.sql

if [ -s migration-diff.sql ]; then
  echo "✅ Diff generado en: migration-diff.sql"
  echo "📊 Tamaño del archivo: $(wc -l < migration-diff.sql) líneas"
  echo ""
  echo "📝 Primeras líneas del diff:"
  head -20 migration-diff.sql
else
  echo "✅ No hay diferencias entre la base de datos y el schema"
  rm migration-diff.sql
fi

