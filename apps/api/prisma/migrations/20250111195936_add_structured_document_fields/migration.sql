-- AlterTable: Agregar campos estructurados a DocumentVersion
-- Estos campos son nullable para mantener compatibilidad con registros existentes

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "structuredData" JSONB;
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "clausePlan" JSONB;
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "generationWarnings" JSONB;
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "templateVersion" TEXT;
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "status" TEXT;

-- Comentarios para documentación (PostgreSQL soporta comentarios)
COMMENT ON COLUMN "DocumentVersion"."structuredData" IS 'Structured document data (user input) - nullable for backward compatibility';
COMMENT ON COLUMN "DocumentVersion"."clausePlan" IS 'Plan of clauses to include in the document - nullable for backward compatibility';
COMMENT ON COLUMN "DocumentVersion"."generationWarnings" IS 'Warnings generated during document creation - nullable for backward compatibility';
COMMENT ON COLUMN "DocumentVersion"."templateVersion" IS 'Version of template used for generation - nullable for backward compatibility';
COMMENT ON COLUMN "DocumentVersion"."status" IS 'Document status: draft | generated | reviewed | final - nullable for backward compatibility';

