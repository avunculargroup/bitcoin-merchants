-- Add duplicate_osm_id and duplicate_osm_type columns to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS duplicate_osm_id BIGINT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS duplicate_osm_type VARCHAR(50);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS duplicate_matches JSONB;

-- Add comments for the new columns
COMMENT ON COLUMN submissions.duplicate_osm_id IS 'OSM ID of the duplicate element if found';
COMMENT ON COLUMN submissions.duplicate_osm_type IS 'Type of the duplicate OSM element (node or way)';
COMMENT ON COLUMN submissions.duplicate_matches IS 'List of potential duplicate matches returned by the duplicate check';

