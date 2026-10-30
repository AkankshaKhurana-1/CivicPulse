-- CivicPulse Production Database Schema
-- Version: 1.0.0

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Cities Table
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Jurisdictions (Zones/Wards)
CREATE TABLE IF NOT EXISTS jurisdictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('ZONE', 'WARD', 'DISTRICT')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Profile (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('citizen', 'worker', 'officer', 'oversight', 'admin')),
    phone VARCHAR(20),
    city_id UUID REFERENCES cities(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Agencies
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    category_coverage TEXT[] NOT NULL,
    contact_email VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Agency Routing Rules
CREATE TABLE IF NOT EXISTS agency_routing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    confidence NUMERIC(3,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Incidents
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    city_id UUID REFERENCES cities(id),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    priority_score NUMERIC(5,2) DEFAULT 50.00,
    priority_level VARCHAR(20) CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    priority_reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    report_count INT DEFAULT 1,
    first_reported_at TIMESTAMPTZ DEFAULT NOW(),
    last_observed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Citizen Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_code VARCHAR(30) UNIQUE NOT NULL,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    city_id UUID REFERENCES cities(id),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    privacy_level VARCHAR(20) DEFAULT 'PUBLIC',
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    linked_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    images TEXT[],
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_code VARCHAR(30) UNIQUE NOT NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE RESTRICT,
    assigned_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_team VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    priority_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    resolution_notes TEXT,
    rejection_reason TEXT,
    sla_breached BOOLEAN DEFAULT FALSE
);

-- 9. Evidence
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES users(id),
    uploader_role VARCHAR(30) NOT NULL,
    evidence_type VARCHAR(30) CHECK (evidence_type IN ('INITIAL_REPORT', 'BEFORE_WORK', 'AFTER_WORK', 'INSPECTION')),
    url TEXT NOT NULL,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    ai_flagged BOOLEAN DEFAULT FALSE,
    ai_flag_reason TEXT
);

-- 10. Verification Records
CREATE TABLE IF NOT EXISTS verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    decision VARCHAR(30) CHECK (decision IN ('APPROVED', 'REJECTED', 'NEEDS_MORE_EVIDENCE')),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Escalations
CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    level INT DEFAULT 1,
    trigger_reason TEXT NOT NULL,
    previous_owner VARCHAR(150),
    new_owner VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE
);

-- 12. Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    before_state TEXT,
    after_state TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Infrastructure Dependency Links
CREATE TABLE IF NOT EXISTS dependency_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    child_incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    relation_type VARCHAR(30) CHECK (relation_type IN ('CAUSES', 'EXACERBATES', 'BLOCKS_REPAIR')),
    confidence NUMERIC(3,2) DEFAULT 0.85,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for fast geospatial & operational queries
CREATE INDEX IF NOT EXISTS idx_reports_lat_lng ON reports(lat, lng);
CREATE INDEX IF NOT EXISTS idx_incidents_lat_lng ON incidents(lat, lng);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_agency ON work_orders(agency_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Citizens can view public reports and create their own
CREATE POLICY "Public reports viewable by all" ON reports FOR SELECT USING (privacy_level = 'PUBLIC');
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
