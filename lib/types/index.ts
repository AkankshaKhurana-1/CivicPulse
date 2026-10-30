export type UserRole = 'citizen' | 'worker' | 'officer' | 'oversight' | 'admin';

export type IssueCategory =
  | 'blocked_drain'
  | 'waterlogging'
  | 'overflowing_waste'
  | 'plastic_litter'
  | 'missed_waste_collection'
  | 'pothole'
  | 'damaged_road'
  | 'broken_streetlight'
  | 'damaged_footpath'
  | 'accessibility_barrier'
  | 'other';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ReportStatus =
  | 'SUBMITTED'
  | 'LINKED_TO_INCIDENT'
  | 'UNDER_TRIAGE'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED_PENDING_VERIFICATION'
  | 'VERIFIED_CLOSED'
  | 'REJECTED'
  | 'REOPENED'
  | 'ESCALATED';

export type WorkOrderStatus =
  | 'NEW'
  | 'TRIAGE'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'COMPLETED_PENDING_VERIFICATION'
  | 'VERIFIED_CLOSED'
  | 'NEEDS_INFORMATION'
  | 'BLOCKED'
  | 'REJECTED_COMPLETION'
  | 'REOPENED'
  | 'ESCALATED'
  | 'CANCELLED';

export type EvidenceType = 'INITIAL_REPORT' | 'BEFORE_WORK' | 'AFTER_WORK' | 'INSPECTION';

export type VerificationDecision = 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_EVIDENCE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  city_id: string;
  agency_id?: string;
  active?: boolean;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  active: boolean;
}

export interface Jurisdiction {
  id: string;
  city_id: string;
  name: string;
  code: string;
  type: 'ZONE' | 'WARD' | 'DISTRICT';
}

export interface Agency {
  id: string;
  city_id: string;
  name: string;
  code: string;
  category_coverage: IssueCategory[];
  contact_email: string;
  active: boolean;
}

export interface RoutingRule {
  id: string;
  city_id: string;
  jurisdiction_id?: string;
  category: IssueCategory;
  agency_id: string;
  confidence: number; // 0 to 1
  is_active: boolean;
}

export type LocationSource = 'gps' | 'manual_pin' | 'exif' | 'address_geocoded';

export interface Report {
  id: string;
  reference_code: string;
  reporter_id?: string;
  reporter_name?: string;
  category: IssueCategory;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  gps_accuracy?: number; // Accuracy radius in meters
  location_source?: LocationSource;
  capture_timestamp?: string;
  city_id: string;
  jurisdiction_id: string;
  privacy_level: 'PUBLIC' | 'RESTRICTED';
  status: ReportStatus;
  linked_incident_id?: string;
  images: string[];
  submitted_at: string;
  updated_at: string;
}

export interface PriorityBreakdown {
  severity_points: number; // Max 25
  safety_impact_points: number; // Max 25
  infrastructure_points: number; // Max 15
  recurrence_points: number; // Max 10
  age_points: number; // Max 10
  corroboration_points: number; // Max 10
  evidence_confidence_points: number; // Max 5
  total_score: number; // 0 - 100
  is_emergency_override: boolean;
  emergency_reason?: string;
}

export interface Incident {
  id: string;
  category: IssueCategory;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  city_id: string;
  jurisdiction_id: string;
  priority_score: number; // 0 to 100
  priority_level: PriorityLevel;
  priority_reason: string;
  priority_breakdown?: PriorityBreakdown;
  is_emergency_override?: boolean;
  emergency_reason?: string;
  status: ReportStatus;
  report_count: number;
  first_reported_at: string;
  last_observed_at: string;
  hotspot_id?: string;
  infrastructure_asset_id?: string;
  linked_report_ids: string[];
}

export interface WorkOrder {
  id: string;
  reference_code: string;
  incident_id: string;
  infrastructure_asset_id?: string;
  agency_id: string;
  agency_name: string;
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  assigned_team?: string;
  status: WorkOrderStatus;
  created_at: string;
  acknowledged_at?: string;
  due_at: string;
  completed_at?: string;
  verified_at?: string;
  resolution_notes?: string;
  rejection_reason?: string;
  sla_breached: boolean;
  priority_level: PriorityLevel;
}

export interface Evidence {
  id: string;
  report_id?: string;
  work_order_id?: string;
  uploader_id: string;
  uploader_role: UserRole;
  evidence_type: EvidenceType;
  url: string;
  captured_at: string;
  uploaded_at: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  perceptual_hash?: string;
  ai_flagged?: boolean;
  ai_flag_reason?: string;
}

export interface VerificationRecord {
  id: string;
  work_order_id: string;
  reviewer_id: string;
  reviewer_name: string;
  decision: VerificationDecision;
  reason: string;
  evidence_reviewed_ids: string[];
  created_at: string;
}

export interface Escalation {
  id: string;
  work_order_id: string;
  level: number;
  trigger_reason: string;
  previous_owner: string;
  new_owner: string;
  created_at: string;
  resolved: boolean;
}

export interface AuditEvent {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  entity_type: 'REPORT' | 'INCIDENT' | 'WORK_ORDER' | 'VERIFICATION' | 'ESCALATION';
  entity_id: string;
  action: string;
  details: string;
  before_state?: string;
  after_state?: string;
  timestamp: string;
}

export interface DependencyLink {
  id: string;
  parent_incident_id: string;
  parent_title: string;
  parent_category: IssueCategory;
  child_incident_id: string;
  child_title: string;
  child_category: IssueCategory;
  relation_type: 'CAUSES' | 'EXACERBATES' | 'BLOCKS_REPAIR';
  confidence: number;
  explanation: string;
}

export interface SLAPolicy {
  id: string;
  city_id: string;
  category: IssueCategory;
  priority_level: PriorityLevel;
  acknowledgement_hours: number;
  resolution_hours: number;
}

export interface DuplicateCandidate {
  incident: Incident;
  distance_meters: number;
  candidate_radius: number;
  geo_similarity: number; // 0 - 100
  text_similarity: number; // 0 - 100
  category_similarity: number; // 0 - 100
  image_similarity?: number; // 0 - 100
  time_similarity?: number; // 0 - 100
  duplicate_score: number; // 0 - 100
  recommendation: 'STRONG_DUPLICATE' | 'POSSIBLE_DUPLICATE' | 'SEPARATE_ISSUE';
  signals_used: string[];
  reason: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'REPORT_STATUS' | 'WORK_ORDER' | 'ESCALATION' | 'DUPLICATE_MERGE' | 'EMERGENCY_OVERRIDE';
  link?: string;
  read: boolean;
  created_at: string;
}

export interface PriorityConfig {
  weights: {
    severity: number; // Default 25
    safety_impact: number; // Default 25
    infrastructure: number; // Default 15
    recurrence: number; // Default 10
    age: number; // Default 10
    corroboration: number; // Default 10
    evidence: number; // Default 5
  };
  thresholds: {
    critical: number; // Default 80
    high: number; // Default 60
    medium: number; // Default 35
    low: number; // Default 0
  };
  emergency_keywords: string[];
}

// =========================================================================
// REPAIR ACCOUNTABILITY & INFRASTRUCTURE FAILURE DNA TYPES
// =========================================================================

export type InfrastructureType =
  | 'ROAD_SEGMENT'
  | 'DRAINAGE_NETWORK'
  | 'STREETLIGHT_CORRIDOR'
  | 'WATER_PIPELINE'
  | 'PUBLIC_FACILITY';

export type FailureMonitoringStatus =
  | 'FIRST_TIME_FAILURE'
  | 'REPAIRED_UNDER_MONITORING'
  | 'RECURRENCE_DETECTED'
  | 'NO_RECURRENCE_OBSERVED'
  | 'CHRONIC_FAILURE_ZONE';

export interface InfrastructureAsset {
  id: string;
  reference_code: string;
  asset_code?: string; // convenience alias
  name: string;
  city_id: string;
  infrastructure_type: InfrastructureType;
  category: IssueCategory;
  lat: number;
  lng: number;
  address: string;
  corridor_description?: string;
  total_incidents: number;
  failure_count?: number; // convenience alias
  total_repairs: number;
  repair_count?: number; // convenience alias
  approved_repairs: number;
  rejected_repairs: number;
  repeat_incidents: number;
  recurrence_count?: number; // convenience alias
  average_time_to_recurrence_days?: number;
  average_recurrence_days?: number; // convenience alias
  last_incident_at?: string;
  last_repaired_at?: string;
  last_inspected_at?: string;
  monitoring_status: FailureMonitoringStatus;
  is_chronic_failure: boolean;
  failure_dna_summary: string;
  linked_incident_ids: string[];
  created_at: string;
  updated_at: string;
}

export type VerificationOutcome =
  | 'ACCEPTABLE_EVIDENCE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'LOCATION_MISMATCH'
  | 'POSSIBLE_DUPLICATE_EVIDENCE'
  | 'MANUAL_REVIEW_REQUIRED';

export interface RepairVerificationAnalysis {
  id: string;
  work_order_id: string;
  incident_id: string;
  infrastructure_id?: string;
  before_photo_url: string;
  after_photo_url: string;
  image_quality_score: number; // 0 - 100
  photo_quality_score?: number; // convenience alias
  image_quality_details: {
    is_clear: boolean;
    is_adequate_exposure: boolean;
    is_high_resolution: boolean;
    contrast_score: number;
  };
  visual_comparison_score: number; // 0 - 100
  visual_difference_score?: number; // convenience alias
  visual_comparison_summary: string;
  location_distance_meters: number;
  distance_meters?: number; // convenience alias
  worker_accuracy_buffer?: number;
  reported_incident_coords: { lat: number; lng: number };
  evidence_upload_coords?: { lat: number; lng: number; accuracy?: number };
  location_consistent: boolean;
  location_matched?: boolean; // convenience alias
  duplicate_evidence_detected: boolean;
  duplicate_check?: { is_duplicate: boolean; similarity: number }; // convenience alias
  perceptual_hash_before: string;
  perceptual_hash_after: string;
  confidence: number; // 0 - 1
  recommendation: VerificationOutcome;
  verification_outcome?: VerificationOutcome; // convenience alias
  explanation: string;
  limitations_notice: string;
  statutory_limitations_notice?: string; // convenience alias
  analyzed_at: string;
}

export interface RepairMonitoringRecord {
  id: string;
  infrastructure_id: string;
  work_order_id: string;
  incident_id: string;
  repair_verified_at: string;
  monitoring_days_configured: number;
  monitoring_expires_at: string;
  days_without_recurrence: number;
  recurrence_detected: boolean;
  recurrence_incident_id?: string;
  recurrence_detected_at?: string;
  time_to_recurrence_days?: number;
  status: 'UNDER_MONITORING' | 'RECURRENCE_DETECTED' | 'NO_RECURRENCE_OBSERVED' | 'INSUFFICIENT_DATA';
}

export interface RecurrenceEvent {
  id: string;
  infrastructure_id: string;
  prior_work_order_id: string;
  prior_verified_at: string;
  recurrence_incident_id: string;
  recurrence_reported_at: string;
  days_between_repair_and_recurrence: number;
  distance_from_prior_repair_meters: number;
  failure_pattern_notes: string;
}

export type RecommendationStatus =
  | 'PENDING_ENGINEER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CONVERTED_TO_INSPECTION_WORK_ORDER';

export interface RootCauseRecommendation {
  id: string;
  infrastructure_id: string;
  infrastructure_name: string;
  observed_pattern: string;
  supporting_incident_count: number;
  previous_repair_count: number;
  potential_root_causes: string[];
  recommended_action: string;
  confidence: number;
  status: RecommendationStatus;
  expert_notes?: string;
  created_at: string;
  converted_work_order_id?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  recommended_agency?: string;
  root_cause_explanation?: string;
}

export interface MaintenanceInspection {
  id: string;
  infrastructure_id: string;
  recommendation_id?: string;
  inspection_type: 'ROOT_CAUSE_STRUCTURAL' | 'ROUTINE_AUDIT' | 'DRAINAGE_CAPACITY' | 'ELECTRICAL_SAFETY';
  agency_id: string;
  agency_name: string;
  assigned_engineer_name?: string;
  scheduled_date: string;
  findings?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

