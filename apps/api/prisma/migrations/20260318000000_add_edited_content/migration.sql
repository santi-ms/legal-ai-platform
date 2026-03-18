-- AlterTable: add editedContent column to DocumentVersion
-- rawText remains the original AI-generated content and is never modified.
-- editedContent overrides rawText for PDF generation when set.
ALTER TABLE "DocumentVersion" ADD COLUMN "editedContent" TEXT;
