-- AlterTable: add editedContent column to DocumentVersion
-- This column stores the user-edited content (overrides rawText for PDF generation).
-- rawText remains the original AI-generated content and is never modified.
ALTER TABLE "DocumentVersion" ADD COLUMN "editedContent" TEXT;
