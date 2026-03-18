-- AlterTable: Agregar outputWarnings a DocumentVersion
-- Almacena los hallazgos de la validación post-generación (output-validator.ts)
-- Separado de generationWarnings, que contiene las warnings pre-generación (semantic rules)
-- Nullable para compatibilidad con versiones existentes

ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "outputWarnings" JSONB;

COMMENT ON COLUMN "DocumentVersion"."outputWarnings" IS
  'Post-generation output validation issues: placeholders, incomplete content, etc. — nullable for backward compatibility';
