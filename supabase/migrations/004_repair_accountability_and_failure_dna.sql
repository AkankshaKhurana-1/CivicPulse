-- =========================================================================
-- CIVICPULSE MIGRATION 004: REPAIR ACCOUNTABILITY & INFRASTRUCTURE FAILURE DNA
-- =========================================================================

-- 1. Infrastructure Assets Table (Physical Municipal Infrastructure Identity)
CREATE TABLE IF NOT EXISTS infrastructure_assets (
    id VARCHAR(50) PRIMARY KEY,
    reference_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city_id VARCHAR(50) NOT NULL,
    infrastructure_type VARCHAR(50) NOT NULL CHECK (
        infrastructure_type IN ('ROAD_SEGMENT', 'DRAINAGE_NETWORK', 'STREETLIGHT_CORRIDOR', 'WATER_PIPELINE', 'PUBLIC_FACILITY')
    ),
    category VARCHAR(50) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    corridor_description TEXT,
    total_incidents INT DEFAULT 0,
    total_repairs INT DEFAULT 0,
    approved_repairs INT DEFAULT 0,
    rejected_repairs INT DEFAULT 0,
    repeat_incidents INT DEFAULT 0,
    average_time_to_recurrence_days INT,
    last_incident_at TIMESTAMPTZ,
    last_repaired_at TIMESTAMPTZ,
    last_inspected_at TIMESTAMPTZ,
    monitoring_status VARCHAR(50) NOT NULL DEFAULT 'FIRST_TIME_FAILURE' CHECK (
        monitoring_status IN ('FIRST_TIME_FAILURE', 'REPAIRED_UNDER_MONITORING', 'RECURRENCE_DETECTED', 'NO_RECURRENCE_OBSERVED', 'CHRONIC_FAILURE_ZONE')
    ),
    is_chronic_failure BOOLEAN DEFAULT FALSE,
    failure_dna_summary TEXT NOT NULL,
    linked_incident_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Infrastructure Incident Links Table
CREATE TABLE IF NOT EXISTS infrastructure_incident_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    infrastructure_id VARCHAR(50) NOT NULL REFERENCES infrastructure_assets(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL,
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    link_reason TEXT,
    CONSTRAINT unique_asset_incident_link UNIQUE (infrastructure_id, incident_id)
);

-- 3. AI Repair Verification Analyses Table
CREATE TABLE IF NOT EXISTS repair_verification_analyses (
    id VARCHAR(100) PRIMARY KEY,
    work_order_id UUID NOT NULL,
    incident_id UUID NOT NULL,
    infrastructure_id VARCHAR(50) REFERENCES infrastructure_assets(id) ON DELETE SET NULL,
    before_photo_url TEXT NOT NULL,
    after_photo_url TEXT NOT NULL,
    image_quality_score INT NOT NULL CHECK (image_quality_score >= 0 AND image_quality_score <= 100),
    image_quality_details JSONB NOT NULL DEFAULT '{}'::JSONB,
    visual_comparison_score INT NOT NULL CHECK (visual_comparison_score >= 0 AND visual_comparison_score <= 100),
    visual_comparison_summary TEXT NOT NULL,
    location_distance_meters INT NOT NULL DEFAULT 0,
    reported_incident_coords JSONB NOT NULL,
    evidence_upload_coords JSONB,
    location_consistent BOOLEAN NOT NULL DEFAULT TRUE,
    duplicate_evidence_detected BOOLEAN NOT NULL DEFAULT FALSE,
    perceptual_hash_before VARCHAR(64),
    perceptual_hash_after VARCHAR(64),
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.85,
    recommendation VARCHAR(50) NOT NULL CHECK (
        recommendation IN ('ACCEPTABLE_EVIDENCE', 'INSUFFICIENT_EVIDENCE', 'LOCATION_MISMATCH', 'POSSIBLE_DUPLICATE_EVIDENCE', 'MANUAL_REVIEW_REQUIRED')
    ),
    explanation TEXT NOT NULL,
    limitations_notice TEXT NOT NULL,
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Repair Monitoring Records Table
CREATE TABLE IF NOT EXISTS repair_monitoring_records (
    id VARCHAR(100) PRIMARY KEY,
    infrastructure_id VARCHAR(50) NOT NULL REFERENCES infrastructure_assets(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL,
    incident_id UUID NOT NULL,
    repair_verified_at TIMESTAMPTZ NOT NULL,
    monitoring_days_configured INT NOT NULL DEFAULT 60,
    monitoring_expires_at TIMESTAMPTZ NOT NULL,
    days_without_recurrence INT NOT NULL DEFAULT 0,
    recurrence_detected BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_incident_id UUID,
    recurrence_detected_at TIMESTAMPTZ,
    time_to_recurrence_days INT,
    status VARCHAR(50) NOT NULL DEFAULT 'UNDER_MONITORING' CHECK (
        status IN ('UNDER_MONITORING', 'RECURRENCE_DETECTED', 'NO_RECURRENCE_OBSERVED', 'INSUFFICIENT_DATA')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Recurrence Events Table
CREATE TABLE IF NOT EXISTS recurrence_events (
    id VARCHAR(100) PRIMARY KEY,
    infrastructure_id VARCHAR(50) NOT NULL REFERENCES infrastructure_assets(id) ON DELETE CASCADE,
    prior_work_order_id UUID NOT NULL,
    prior_verified_at TIMESTAMPTZ NOT NULL,
    recurrence_incident_id UUID NOT NULL,
    recurrence_reported_at TIMESTAMPTZ NOT NULL,
    days_between_repair_and_recurrence INT NOT NULL,
    distance_from_prior_repair_meters INT NOT NULL,
    failure_pattern_notes TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Root Cause Recommendations Table
CREATE TABLE IF NOT EXISTS root_cause_recommendations (
    id VARCHAR(100) PRIMARY KEY,
    infrastructure_id VARCHAR(50) NOT NULL REFERENCES infrastructure_assets(id) ON DELETE CASCADE,
    infrastructure_name VARCHAR(255) NOT NULL,
    observed_pattern TEXT NOT NULL,
    supporting_incident_count INT NOT NULL,
    previous_repair_count INT NOT NULL,
    potential_root_causes TEXT[] NOT NULL,
    recommended_action TEXT NOT NULL,
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.90,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_ENGINEER_REVIEW' CHECK (
        status IN ('PENDING_ENGINEER_REVIEW', 'ACCEPTED', 'REJECTED', 'CONVERTED_TO_INSPECTION_WORK_ORDER')
    ),
    expert_notes TEXT,
    converted_work_order_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Maintenance Inspections Table
CREATE TABLE IF NOT EXISTS maintenance_inspections (
    id VARCHAR(100) PRIMARY KEY,
    infrastructure_id VARCHAR(50) NOT NULL REFERENCES infrastructure_assets(id) ON DELETE CASCADE,
    recommendation_id VARCHAR(100) REFERENCES root_cause_recommendations(id) ON DELETE SET NULL,
    inspection_type VARCHAR(50) NOT NULL CHECK (
        inspection_type IN ('ROOT_CAUSE_STRUCTURAL', 'ROUTINE_AUDIT', 'DRAINAGE_CAPACITY', 'ELECTRICAL_SAFETY')
    ),
    agency_id UUID NOT NULL,
    agency_name VARCHAR(150) NOT NULL,
    assigned_engineer_name VARCHAR(150),
    scheduled_date TIMESTAMPTZ NOT NULL,
    findings TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (
        status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_infra_assets_city ON infrastructure_assets(city_id);
CREATE INDEX IF NOT EXISTS idx_infra_assets_category ON infrastructure_assets(category);
CREATE INDEX IF NOT EXISTS idx_infra_assets_chronic ON infrastructure_assets(is_chronic_failure);
CREATE INDEX IF NOT EXISTS idx_infra_assets_coords ON infrastructure_assets(lat, lng);
CREATE INDEX IF NOT EXISTS idx_repair_analysis_wo ON repair_verification_analyses(work_order_id);
CREATE INDEX IF NOT EXISTS idx_repair_analysis_rec ON repair_verification_analyses(recommendation);
CREATE INDEX IF NOT EXISTS idx_repair_monitoring_asset ON repair_monitoring_records(infrastructure_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_events_asset ON recurrence_events(infrastructure_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_asset ON root_cause_recommendations(infrastructure_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON root_cause_recommendations(status);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE infrastructure_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_incident_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_verification_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_monitoring_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE root_cause_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_inspections ENABLE ROW LEVEL SECURITY;

-- Read policies: Authenticated users and public portal can inspect infrastructure profiles
CREATE POLICY "Public read infrastructure assets"
    ON infrastructure_assets FOR SELECT
    USING (TRUE);

CREATE POLICY "Public read recurrence events"
    ON recurrence_events FOR SELECT
    USING (TRUE);

CREATE POLICY "Staff read repair analyses"
    ON repair_verification_analyses FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Staff read recommendations"
    ON root_cause_recommendations FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Staff read inspections"
    ON maintenance_inspections FOR SELECT
    TO authenticated
    USING (TRUE);

-- Write policies: Protected service-role / authenticated staff only
CREATE POLICY "Staff write repair analyses"
    ON repair_verification_analyses FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Staff write recommendations"
    ON root_cause_recommendations FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);
