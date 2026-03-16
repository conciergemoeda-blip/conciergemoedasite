-- =============================================
-- Migration: Add featured_photos column
-- Description: Stores URLs of photos marked as favorites/highlights.
--              Featured photos appear first in the property gallery.
-- Date: 2026-03-16
-- =============================================

-- Add the column (JSONB array, defaults to empty array)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS featured_photos JSONB DEFAULT '[]'::jsonb;

-- Add a comment for documentation
COMMENT ON COLUMN properties.featured_photos IS 'Array of gallery image URLs marked as featured/favorites. These appear first in the gallery display.';
