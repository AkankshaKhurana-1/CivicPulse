-- CivicPulse Advanced Features Database Migration
-- Version: 1.1.0

-- 1. Extend reports with accurate GPS & capture metadata
ALTER TABLE reports ADD COLUMN IF NOT EXISTS gps_accuracy DOUBLE PRECISION DEFAULT 15.0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS location_source VARCHAR(30) DEFAULT 'gps';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS capture_timestamp TIMESTAMPTZ DEFAULT NOW();

-- 2. Extend incidents with emergency overrides & priority breakdown
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS is_emergency_override BOOLEAN DEFAULT FALSE;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS emergency_reason TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS priority_breakdown JSONB;

-- 3. Duplicate Candidates Table
CREATE TABLE IF NOT EXISTS duplicate_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    matched_incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    distance_meters DOUBLE PRECISION NOT NULL,
    candidate_radius DOUBLE PRECISION NOT NULL,
    geo_similarity NUMERIC(5,2) NOT NULL,
    text_similarity NUMERIC(5,2) NOT NULL,
    category_similarity NUMERIC(5,2) NOT NULL,
    image_similarity NUMERIC(5,2),
    time_similarity NUMERIC(5,2),
    duplicate_score NUMERIC(5,2) NOT NULL,
    recommendation VARCHAR(30) CHECK (recommendation IN ('STRONG_DUPLICATE', 'POSSIBLE_DUPLICATE', 'SEPARATE_ISSUE')),
    signals_used TEXT[] NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'CONFIRMED_MERGED', 'DISMISSED_SEPARATE')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Priority Configurations Table (Configurable Weights & Thresholds)
CREATE TABLE IF NOT EXISTS priority_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    severity_weight NUMERIC(4,2) DEFAULT 25.00,
    safety_impact_weight NUMERIC(4,2) DEFAULT 25.00,
    infrastructure_weight NUMERIC(4,2) DEFAULT 15.00,
    recurrence_weight NUMERIC(4,2) DEFAULT 10.00,
    age_weight NUMERIC(4,2) DEFAULT 10.00,
    corroboration_weight NUMERIC(4,2) DEFAULT 10.00,
    evidence_weight NUMERIC(4,2) DEFAULT 5.00,
    critical_threshold NUMERIC(4,2) DEFAULT 80.00,
    high_threshold NUMERIC(4,2) DEFAULT 60.00,
    medium_threshold NUMERIC(4,2) DEFAULT 35.00,
    emergency_keywords TEXT[] DEFAULT ARRAY[
      'open manhole',
      'manhole cover missing',
      'exposed live wire',
      'fallen electric pole',
      'hanging electric wire',
      'collapsing building',
      'gas leak',
      'major bridge crack',
      'sinkhole'
    ],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_duplicate_candidates_score ON duplicate_candidates(duplicate_score);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Row Level Security (RLS)
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public read priority configurations" ON priority_configurations
    FOR SELECT USING (true);
