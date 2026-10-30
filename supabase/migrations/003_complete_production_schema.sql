-- CivicPulse Complete Production Database Schema & Least-Privilege RLS Policies
-- Version: 2.1.0 (Hardened & Least-Privilege Audited)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. BASE TABLES
-- =========================================================================

-- 1. Cities Table (Public Municipal Directory)
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Jurisdictions Table (Zones & Wards)
CREATE TABLE IF NOT EXISTS jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('ZONE', 'WARD', 'DISTRICT')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_jurisdiction_city_code UNIQUE (city_id, code)
);

-- 3. Agencies Table (Civic Departments)
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    category_coverage TEXT[] NOT NULL,
    contact_email VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Users Profile Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('citizen', 'worker', 'officer', 'oversight', 'admin')),
    phone VARCHAR(20),
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Agency Routing Rules Table
CREATE TABLE IF NOT EXISTS agency_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    confidence NUMERIC(3,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Incidents Table (Underlying Issues)
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE SET NULL,
    priority_score NUMERIC(5,2) DEFAULT 50.00,
    priority_level VARCHAR(20) CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    priority_reason TEXT,
    priority_breakdown JSONB,
    is_emergency_override BOOLEAN DEFAULT FALSE,
    emergency_reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    report_count INT DEFAULT 1,
    first_reported_at TIMESTAMPTZ DEFAULT NOW(),
    last_observed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Citizen Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code VARCHAR(30) UNIQUE NOT NULL,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    gps_accuracy DOUBLE PRECISION DEFAULT 15.0,
    location_source VARCHAR(30) DEFAULT 'gps',
    capture_timestamp TIMESTAMPTZ DEFAULT NOW(),
    address TEXT NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    jurisdiction_id UUID REFERENCES jurisdictions(id) ON DELETE SET NULL,
    privacy_level VARCHAR(20) DEFAULT 'PUBLIC' CHECK (privacy_level IN ('PUBLIC', 'PRIVATE', 'RESTRICTED')),
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    linked_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Work Orders Table (Operational Assignments)
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code VARCHAR(30) UNIQUE NOT NULL,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE RESTRICT,
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

-- 9. Evidence Table (Field Photos)
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    uploader_role VARCHAR(30) NOT NULL,
    evidence_type VARCHAR(30) CHECK (evidence_type IN ('INITIAL_REPORT', 'BEFORE_WORK', 'AFTER_WORK', 'INSPECTION')),
    url TEXT NOT NULL,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    ai_flagged BOOLEAN DEFAULT FALSE,
    ai_flag_reason TEXT
);

-- 10. Verification Records Table (Supervisory Approvals)
CREATE TABLE IF NOT EXISTS verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    decision VARCHAR(30) CHECK (decision IN ('APPROVED', 'REJECTED', 'NEEDS_MORE_EVIDENCE')),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Escalations Table
CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    level INT DEFAULT 1,
    trigger_reason TEXT NOT NULL,
    previous_owner VARCHAR(150),
    new_owner VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE
);

-- 12. Audit Events Table (Immutable Accountability Trail)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
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

-- 13. Infrastructure Dependency Links Table
CREATE TABLE IF NOT EXISTS dependency_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    child_incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    relation_type VARCHAR(30) CHECK (relation_type IN ('CAUSES', 'EXACERBATES', 'BLOCKS_REPAIR')),
    confidence NUMERIC(3,2) DEFAULT 0.85,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_dependency_link UNIQUE (parent_incident_id, child_incident_id)
);

-- 14. Duplicate Candidates Table
CREATE TABLE IF NOT EXISTS duplicate_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 15. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Priority Configurations Table
CREATE TABLE IF NOT EXISTS priority_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE UNIQUE,
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

-- =========================================================================
-- 2. INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_reports_lat_lng ON reports(lat, lng);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_linked_incident ON reports(linked_incident_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_incidents_lat_lng ON incidents(lat, lng);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority_score);

CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_agency ON work_orders(agency_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_incident ON work_orders(incident_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_worker ON work_orders(assigned_worker_id);

CREATE INDEX IF NOT EXISTS idx_evidence_work_order ON evidence(work_order_id);
CREATE INDEX IF NOT EXISTS idx_evidence_report ON evidence(report_id);

CREATE INDEX IF NOT EXISTS idx_duplicate_candidates_score ON duplicate_candidates(duplicate_score);
CREATE INDEX IF NOT EXISTS idx_duplicate_candidates_report ON duplicate_candidates(report_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_candidates_incident ON duplicate_candidates(matched_incident_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_id);

-- =========================================================================
-- 3. POSTGRESQL RLS HELPER FUNCTIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_agency()
RETURNS UUID AS $$
  SELECT agency_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =========================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES — LEAST-PRIVILEGE AUDITED
-- =========================================================================
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_links ENABLE ROW LEVEL SECURITY;

-- 4.1 Cities, Jurisdictions, Agencies (Public Metadata Directory)
DROP POLICY IF EXISTS "Public read cities" ON cities;
CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read jurisdictions" ON jurisdictions;
CREATE POLICY "Public read jurisdictions" ON jurisdictions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read agencies" ON agencies;
CREATE POLICY "Public read agencies" ON agencies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff read routing rules" ON agency_routing_rules;
CREATE POLICY "Staff read routing rules" ON agency_routing_rules
  FOR SELECT USING (public.get_current_user_role() IN ('officer', 'oversight', 'admin'));

-- 4.2 Priority Configurations (Transparent Civic Algorithm Parameters)
DROP POLICY IF EXISTS "Public read priority configurations" ON priority_configurations;
CREATE POLICY "Public read priority configurations" ON priority_configurations FOR SELECT USING (true);

-- 4.3 Users (RESTRICTED: No anonymous access. Users read own, staff read colleagues)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Staff can read colleague profiles" ON users;
CREATE POLICY "Staff can read colleague profiles" ON users
  FOR SELECT USING (public.get_current_user_role() IN ('worker', 'officer', 'oversight', 'admin'));

DROP POLICY IF EXISTS "Users can update own contact profile" ON users;
CREATE POLICY "Users can update own contact profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

-- 4.4 Incidents (Public Map and Transparency)
DROP POLICY IF EXISTS "Public read incidents" ON incidents;
CREATE POLICY "Public read incidents" ON incidents FOR SELECT USING (true);

-- 4.5 Reports (Citizens submit, read public or own private, staff inspect)
DROP POLICY IF EXISTS "Public reports viewable by all" ON reports;
CREATE POLICY "Public reports viewable by all" ON reports
  FOR SELECT USING (privacy_level = 'PUBLIC');

DROP POLICY IF EXISTS "Private reports viewable by author and staff" ON reports;
CREATE POLICY "Private reports viewable by author and staff" ON reports
  FOR SELECT USING (
    (auth.uid() = reporter_id) OR
    (public.get_current_user_role() IN ('worker', 'officer', 'oversight', 'admin'))
  );

DROP POLICY IF EXISTS "Citizens can create reports" ON reports;
CREATE POLICY "Citizens can create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id IS NULL OR reporter_id = auth.uid());

DROP POLICY IF EXISTS "Author can update submitted report" ON reports;
CREATE POLICY "Author can update submitted report" ON reports
  FOR UPDATE USING (auth.uid() = reporter_id AND status = 'SUBMITTED')
  WITH CHECK (auth.uid() = reporter_id AND status = 'SUBMITTED');

-- 4.6 Work Orders (RESTRICTED: Zero anon/citizen read. Workers assigned, officers agency-scoped)
DROP POLICY IF EXISTS "Field workers read assigned work orders" ON work_orders;
CREATE POLICY "Field workers read assigned work orders" ON work_orders
  FOR SELECT USING (assigned_worker_id = auth.uid());

DROP POLICY IF EXISTS "Agency officers read agency work orders" ON work_orders;
CREATE POLICY "Agency officers read agency work orders" ON work_orders
  FOR SELECT USING (
    (public.get_current_user_role() = 'officer' AND agency_id = public.get_current_user_agency()) OR
    (public.get_current_user_role() IN ('oversight', 'admin'))
  );

DROP POLICY IF EXISTS "Assigned worker update completion" ON work_orders;
CREATE POLICY "Assigned worker update completion" ON work_orders
  FOR UPDATE USING (assigned_worker_id = auth.uid())
  WITH CHECK (assigned_worker_id = auth.uid());

-- 4.7 Evidence (RESTRICTED: Public report photos visible. Operational photos restricted to assigned worker and staff)
DROP POLICY IF EXISTS "Initial report evidence viewable with public reports" ON evidence;
CREATE POLICY "Initial report evidence viewable with public reports" ON evidence
  FOR SELECT USING (
    evidence_type = 'INITIAL_REPORT' AND
    EXISTS (SELECT 1 FROM reports r WHERE r.id = evidence.report_id AND r.privacy_level = 'PUBLIC')
  );

DROP POLICY IF EXISTS "Assigned workers view evidence for own work orders" ON evidence;
CREATE POLICY "Assigned workers view evidence for own work orders" ON evidence
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM work_orders w WHERE w.id = evidence.work_order_id AND w.assigned_worker_id = auth.uid())
  );

DROP POLICY IF EXISTS "Staff view all evidence" ON evidence;
CREATE POLICY "Staff view all evidence" ON evidence
  FOR SELECT USING (public.get_current_user_role() IN ('officer', 'oversight', 'admin'));

DROP POLICY IF EXISTS "Workers and reporters can upload evidence" ON evidence;
CREATE POLICY "Workers and reporters can upload evidence" ON evidence
  FOR INSERT WITH CHECK (uploader_id IS NULL OR uploader_id = auth.uid());

-- 4.8 Verification Records (RESTRICTED: Supervisors & Officers only)
DROP POLICY IF EXISTS "Supervisors and officers view verification records" ON verification_records;
CREATE POLICY "Supervisors and officers view verification records" ON verification_records
  FOR SELECT USING (public.get_current_user_role() IN ('officer', 'oversight', 'admin'));

DROP POLICY IF EXISTS "Only supervisors can insert verification records" ON verification_records;
CREATE POLICY "Only supervisors can insert verification records" ON verification_records
  FOR INSERT WITH CHECK (public.get_current_user_role() IN ('oversight', 'admin') AND reviewer_id = auth.uid());

-- 4.9 Escalations (RESTRICTED: Staff only)
DROP POLICY IF EXISTS "Staff view escalations" ON escalations;
CREATE POLICY "Staff view escalations" ON escalations
  FOR SELECT USING (public.get_current_user_role() IN ('officer', 'oversight', 'admin'));

-- 4.10 Audit Events (RESTRICTED: Immutable accountability trail viewable strictly by staff)
DROP POLICY IF EXISTS "Only staff can read audit events" ON audit_events;
CREATE POLICY "Only staff can read audit events" ON audit_events
  FOR SELECT USING (public.get_current_user_role() IN ('officer', 'oversight', 'admin'));

-- 4.11 Duplicate Candidates (RESTRICTED: Officers & Supervisors internal queue)
DROP POLICY IF EXISTS "Only officers and supervisors view duplicate queue" ON duplicate_candidates;
CREATE POLICY "Only officers and supervisors view duplicate queue" ON duplicate_candidates
  FOR SELECT USING (public.get_current_user_role() IN ('officer', 'oversight', 'admin'));

-- 4.12 Infrastructure Dependency Links (RESTRICTED: Staff view)
DROP POLICY IF EXISTS "Only staff can read dependency links" ON dependency_links;
CREATE POLICY "Only staff can read dependency links" ON dependency_links
  FOR SELECT USING (public.get_current_user_role() IN ('officer', 'oversight', 'admin'));

-- 4.13 In-App Notifications (STRICTLY USER-SCOPED)
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications read status" ON notifications;
CREATE POLICY "Users update own notifications read status" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
