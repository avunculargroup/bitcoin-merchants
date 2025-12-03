-- Add duplicate_osm_id and duplicate_osm_type columns to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS duplicate_osm_id BIGINT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS duplicate_osm_type VARCHAR(50);

-- Add comments for the new columns
COMMENT ON COLUMN submissions.duplicate_osm_id IS 'OSM ID of the duplicate element if found';
COMMENT ON COLUMN submissions.duplicate_osm_type IS 'Type of the duplicate OSM element (node or way)';

