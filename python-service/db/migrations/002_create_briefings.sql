-- Create briefings table
CREATE TABLE IF NOT EXISTS briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    sector VARCHAR(255) NOT NULL,
    analyst_name VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    is_generated BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create briefing_points table
CREATE TABLE IF NOT EXISTS briefing_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    point_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0
);

-- Create briefing_metrics table
CREATE TABLE IF NOT EXISTS briefing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_briefing_metric_name UNIQUE (briefing_id, name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_briefing_points_briefing_id ON briefing_points(briefing_id);
CREATE INDEX IF NOT EXISTS idx_briefing_metrics_briefing_id ON briefing_metrics(briefing_id);
CREATE INDEX IF NOT EXISTS idx_briefings_created_at ON briefings(created_at DESC);
