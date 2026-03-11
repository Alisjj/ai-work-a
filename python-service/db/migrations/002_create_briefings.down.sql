-- Drop indexes
DROP INDEX IF EXISTS idx_briefings_created_at;
DROP INDEX IF EXISTS idx_briefing_metrics_briefing_id;
DROP INDEX IF EXISTS idx_briefing_points_briefing_id;

-- Drop tables (in reverse order of creation)
DROP TABLE IF EXISTS briefing_metrics;
DROP TABLE IF EXISTS briefing_points;
DROP TABLE IF EXISTS briefings;
