-- Migration: Add User Profile Fields
-- This script adds the bio and notificationPreferences columns to the User table
-- Run this if Prisma migrate doesn't work

-- Add bio column (nullable text)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- Add notificationPreferences column (nullable JSONB)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('bio', 'notificationPreferences');

