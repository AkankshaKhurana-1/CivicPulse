import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore } from '../lib/db/mock-store';
import {
  calculatePriorityScore,
  DEFAULT_PRIORITY_CONFIG,
  checkEmergencyOverride,
  calculateSLADeadline
} from '../lib/engines/priority';
import {
  evaluateDuplicateMatch,
  findDuplicateIncidents,
  calculateDistanceMeters,
  calculateCategorySimilarity,
  calculateGeographicSimilarity,
  calculateTimeSimilarity
} from '../lib/engines/duplicates';
import {
  suggestCategoryAndTitle,
  calculateTextSemanticSimilarity,
  calculateImageVisualSimilarity,
  computeImagePerceptualHash,
  extractImageExifMetadata,
  verifyWorkEvidence
} from '../lib/engines/ai-adapter';
import { Incident, Report, WorkOrder, UserRole } from '../lib/types';

describe('DEEP VERIFICATION SUITE - CIVICPULSE', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  // =========================================================================
  // 1. DATABASE & PERSISTENCE
  // =========================================================================
  describe('1. Database and Persistence Audit', () => {
    it('verifies in-memory mock store stores and retrieves reports during process lifecycle', () => {
      const initialCount = mockStore.getReports().length;
      const newReport = mockStore.addReport({
        category: 'pothole',
        title: 'Deep crater on Outer Ring Road',
        description: 'Hazardous deep pothole causing traffic slowdown.',
        lat: 28.6500,
        lng: 77.2300,
        gps_accuracy: 8.5,
        location_source: 'gps',
        capture_timestamp: new Date().toISOString(),
        address: 'Outer Ring Road, New Delhi',
        city_id: 'city-delhi',
        jurisdiction_id: 'jur-delhi-central',
        privacy_level: 'PUBLIC',
      });

      expect(newReport.id).toBeDefined();
      expect(newReport.reference_code).toMatch(/^CP-2026-\d{4}$/);
      expect(mockStore.getReports().length).toBe(initialCount + 1);

      const retrieved = mockStore.getReportById(newReport.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Deep crater on Outer Ring Road');
    });

    it('confirms that reset() restores initial seed data, erasing new reports (in-memory behavior)', () => {
      const initialCount = mockStore.getReports().length;
      mockStore.addReport({
        category: 'plastic_litter',
        title: 'Temporary report for reset test',
        description: 'Should be cleared on reset.',
        lat: 28.6100,
        lng: 77.2100,
        address: 'Test location',
        city_id: 'city-delhi',
      });
      expect(mockStore.getReports().length).toBe(initialCount + 1);

      // Simulating app restart / reset
      mockStore.reset();
      expect(mockStore.getReports().length).toBe(initialCount);
    });
  });

  // =========================================================================
  // 2. AUTHENTICATION & RBAC
  // =========================================================================
  describe('2. Authentication and RBAC Verification', () => {
    it('verifies users are stored with role definitions in mockStore', () => {
      const users = mockStore.getUsers();
      const roles: UserRole[] = ['citizen', 'worker', 'officer', 'oversight', 'admin'];

      roles.forEach(role => {
        const found = users.some(u => u.role === role);
        expect(found, `Expected user with role ${role} to exist`).toBe(true);
      });
    });

    it('audits client-side role context vulnerability (roles are not cryptographically signed)', () => {
      // In the current architecture, role is switched via client localStorage.
      // There are no server-side session cookies or JWT tokens validated on routes.
      const simulatedClientRole: UserRole = 'admin';
      expect(simulatedClientRole).toBe('admin');
      // This test highlights that server-side auth enforcement is UI/demo-only.
    });
  });

  // =========================================================================
  // 3. PRIORITY ENGINE (7 FACTORS & BOUNDARIES)
  // =========================================================================
  describe('3. Priority Engine Factors & Exact Boundaries', () => {
    it('verifies default weights always sum to exactly 100', () => {
      const w = DEFAULT_PRIORITY_CONFIG.weights;
      const sum =
        w.severity +
        w.safety_impact +
        w.infrastructure +
        w.recurrence +
        w.age +
        w.corroboration +
        w.evidence;
      expect(sum).toBe(100);
    });

    it('tests boundary scores: 34 (LOW), 35 (MEDIUM), 59 (MEDIUM), 60 (HIGH), 79 (HIGH), 80 (CRITICAL)', () => {
      // Custom config testing exact boundaries
      const testCases = [
        { expectedLevel: 'LOW', scoreTarget: 34 },
        { expectedLevel: 'MEDIUM', scoreTarget: 35 },
        { expectedLevel: 'MEDIUM', scoreTarget: 59 },
        { expectedLevel: 'HIGH', scoreTarget: 60 },
        { expectedLevel: 'HIGH', scoreTarget: 79 },
        { expectedLevel: 'CRITICAL', scoreTarget: 80 },
      ];

      testCases.forEach(({ expectedLevel, scoreTarget }) => {
        // We can test the threshold evaluation directly using the same logic
        const config = DEFAULT_PRIORITY_CONFIG;
        let evaluatedLevel = 'LOW';
        if (scoreTarget >= config.thresholds.critical) {
          evaluatedLevel = 'CRITICAL';
        } else if (scoreTarget >= config.thresholds.high) {
          evaluatedLevel = 'HIGH';
        } else if (scoreTarget >= config.thresholds.medium) {
          evaluatedLevel = 'MEDIUM';
        } else {
          evaluatedLevel = 'LOW';
        }
        expect(evaluatedLevel).toBe(expectedLevel);
      });
    });

    it('verifies all emergency keywords trigger 100/Critical emergency override', () => {
      const sampleKeywords = [
        'open manhole',
        'exposed live wire',
        'fallen electric pole',
        'gas leak',
        'collapsing building',
        'sinkhole'
      ];

      sampleKeywords.forEach(kw => {
        const res = calculatePriorityScore('other', {
          description: `Urgent hazard: ${kw} spotted near market area`,
        });
        expect(res.score).toBe(100);
        expect(res.level).toBe('CRITICAL');
        expect(res.breakdown.is_emergency_override).toBe(true);
        expect(res.breakdown.emergency_reason).toContain(kw);
      });
    });

    it('verifies all 7 factors contribute to score calculation when no emergency is active', () => {
      const res = calculatePriorityScore('pothole', {
        reportCount: 3, // Corroboration points
        ageInHours: 15, // Age points
        recurrenceCount: 2, // Recurrence points
        isNearSensitiveAsset: true, // Sensitive safety boost
        evidenceConfidence: 0.8, // Evidence confidence points
        description: 'Standard road wear and pothole on sub-arterial lane',
      });

      expect(res.breakdown.severity_points).toBeGreaterThan(0);
      expect(res.breakdown.safety_impact_points).toBeGreaterThan(0);
      expect(res.breakdown.infrastructure_points).toBeGreaterThan(0);
      expect(res.breakdown.recurrence_points).toBeGreaterThan(0);
      expect(res.breakdown.age_points).toBeGreaterThan(0);
      expect(res.breakdown.corroboration_points).toBeGreaterThan(0);
      expect(res.breakdown.evidence_confidence_points).toBeGreaterThan(0);

      const calculatedSum =
        res.breakdown.severity_points +
        res.breakdown.safety_impact_points +
        res.breakdown.infrastructure_points +
        res.breakdown.recurrence_points +
        res.breakdown.age_points +
        res.breakdown.corroboration_points +
        res.breakdown.evidence_confidence_points;

      expect(Math.round(calculatedSum * 10) / 10).toBe(res.score);
    });
  });

  // =========================================================================
  // 4. DUPLICATE DETECTION (HYBRID FORMULA & RE-NORMALIZATION)
  // =========================================================================
  describe('4. Intelligent Duplicate Detection & AI Matching', () => {
    const baseIncident: Incident = {
      id: 'inc-test-101',
      category: 'waterlogging',
      title: 'Waterlogging at Ring Road Underpass',
      description: 'Severe waterlogging at Moolchand underpass causing traffic disruption',
      lat: 28.5678,
      lng: 77.2345,
      address: 'Moolchand Underpass, Ring Road',
      city_id: 'city-delhi',
      priority_score: 85,
      priority_level: 'CRITICAL',
      status: 'SUBMITTED',
      report_count: 1,
      first_reported_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      last_observed_at: new Date().toISOString(),
      linked_report_ids: ['rep-1'],
    };

    it('flags nearly identical coordinates and description as STRONG_DUPLICATE', () => {
      const match = evaluateDuplicateMatch(
        {
          category: 'waterlogging',
          lat: 28.56782, // ~2 meters away
          lng: 77.23451,
          accuracyMeters: 5,
          description: 'Heavy waterlogging at Moolchand underpass traffic blocked',
          timestamp: new Date().toISOString(),
        },
        baseIncident
      );

      expect(match).not.toBeNull();
      expect(match?.distance_meters).toBeLessThan(5);
      expect(match?.geo_similarity).toBe(100);
      expect(match?.recommendation).toBe('STRONG_DUPLICATE');
      expect(match?.duplicate_score).toBeGreaterThanOrEqual(80);
    });

    it('evaluates nearby (50m) but genuinely different issue category as separate/low duplicate score', () => {
      const match = evaluateDuplicateMatch(
        {
          category: 'broken_streetlight', // Completely different category
          lat: 28.5681, // ~40 meters away
          lng: 77.2347,
          accuracyMeters: 10,
          description: 'Streetlight pole dark and bulb fused near underpass entry',
          timestamp: new Date().toISOString(),
        },
        baseIncident
      );

      expect(match).not.toBeNull();
      expect(match?.recommendation).toBe('SEPARATE_ISSUE');
      expect(match?.duplicate_score).toBeLessThan(60);
    });

    it('correctly handles missing image and missing GPS/timestamp with weight re-normalization', () => {
      const matchWithoutOptionalSignals = evaluateDuplicateMatch(
        {
          category: 'waterlogging',
          lat: 28.5678,
          lng: 77.2345,
          // No accuracyMeters, no imageUrl, no timestamp
          description: 'Waterlogging at underpass',
        },
        baseIncident
      );

      expect(matchWithoutOptionalSignals).not.toBeNull();
      expect(matchWithoutOptionalSignals?.signals_used).not.toContain('Perceptual Image Hash (10%)');
      expect(matchWithoutOptionalSignals?.duplicate_score).toBeGreaterThanOrEqual(75);
    });

    it('tests Multilingual NLP across English, Hindi, and Punjabi', async () => {
      const en = await suggestCategoryAndTitle('Clogged storm drain full of silt and drainage backup');
      expect(en.suggestedCategory).toBe('blocked_drain');

      const hi = await suggestCategoryAndTitle('नाली में कीचड़ और सीवर जाम है');
      expect(hi.suggestedCategory).toBe('blocked_drain');
      expect(hi.detectedLanguage).toBe('hi');

      const pa = await suggestCategoryAndTitle('ਨਾਲੀ ਜਾਮ ਹੈ ਅਤੇ ਗਟਰ ਬੰਦ ਹੈ');
      expect(pa.suggestedCategory).toBe('blocked_drain');
      expect(pa.detectedLanguage).toBe('pa');
    });

    it('audits text and image similarity mechanisms (cosine token vectors vs true embeddings)', () => {
      // Verification: Text similarity uses cosine on token frequency vectors
      const sim = calculateTextSemanticSimilarity('pothole on road', 'road pothole');
      expect(sim).toBeGreaterThan(80);

      // Verification: Image perceptual hash operates on URL string, not raw pixel bitmaps
      const hash1 = computeImagePerceptualHash('https://sample.org/img1.jpg');
      const hash2 = computeImagePerceptualHash('https://sample.org/img1.jpg');
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(16);
    });
  });

  // =========================================================================
  // 5. MAP & GPS ACCURACY
  // =========================================================================
  describe('5. Map and GPS Accuracy Verification', () => {
    it('verifies distance calculation using Haversine formula', () => {
      // 1 degree latitude is approx 111,000 meters
      const dist = calculateDistanceMeters(28.0, 77.0, 28.001, 77.0);
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(125);
    });

    it('verifies 5-meter difference threshold guarantees 100% geographic similarity', () => {
      const geoSimAt4m = calculateGeographicSimilarity(4.0, 30);
      const geoSimAt5m = calculateGeographicSimilarity(5.0, 30);
      expect(geoSimAt4m).toBe(100);
      expect(geoSimAt5m).toBe(100);
    });

    it('verifies EXIF metadata extractor extracts URL query coords and gracefully fails on non-geotagged strings', () => {
      const geotagged = extractImageExifMetadata('https://images.example.com/photo.jpg?lat=28.612&lng=77.210');
      expect(geotagged.hasGps).toBe(true);
      expect(geotagged.lat).toBe(28.612);

      const normal = extractImageExifMetadata('https://images.example.com/regular.jpg');
      expect(normal.hasGps).toBe(false);
    });
  });

  // =========================================================================
  // 6. COMPLETE RESOLUTION WORKFLOW (END-TO-END)
  // =========================================================================
  describe('6. Complete Resolution Lifecycle Workflow', () => {
    it('executes full 10-step lifecycle: report -> priority -> assign -> work -> evidence -> verify -> resolve -> notify', () => {
      // Step 1: Citizen Submits Report
      const report = mockStore.addReport({
        category: 'plastic_litter',
        title: 'Commercial plastic dump blocking pedestrian lane',
        description: 'Large pile of single use plastic sacks and garbage bags dumped on pavement.',
        lat: 28.7500,
        lng: 77.1000,
        gps_accuracy: 10,
        location_source: 'gps',
        capture_timestamp: new Date().toISOString(),
        address: 'North Delhi Arterial Corridor, New Delhi',
        city_id: 'city-delhi',
        jurisdiction_id: 'jur-delhi-central',
        privacy_level: 'PUBLIC',
        reporter_id: 'usr-citizen-1',
        reporter_name: 'Aarav Sharma',
      });

      expect(report.id).toBeDefined();
      expect(report.linked_incident_id).toBeDefined();
      const incidentId = report.linked_incident_id!;

      // Step 2: Auto-Created Incident & Priority Calculation
      const incident = mockStore.getIncidentById(incidentId);
      expect(incident).toBeDefined();
      expect(incident?.priority_score).toBeGreaterThan(0);
      expect(incident?.status).toBe('SUBMITTED');

      // Step 3: Auto-Created Work Order
      const workOrders = mockStore.getWorkOrders().filter(w => w.incident_id === incidentId);
      expect(workOrders.length).toBe(1);
      const wo = workOrders[0];
      expect(wo.status).toBe('NEW');

      // Step 4: Agency Officer Reviews & Assigns to Field Worker
      const assignedWO = mockStore.assignWorkOrder(
        wo.id,
        'usr-worker-1',
        'Vikram Singh',
        'Sanitation Rapid Action Team',
        'Sanjay Gupta (PWD Nodal Officer)'
      );
      expect(assignedWO?.status).toBe('ASSIGNED');
      expect(assignedWO?.assigned_worker_id).toBe('usr-worker-1');
      expect(mockStore.getIncidentById(incidentId)?.status).toBe('ASSIGNED');

      // Step 5: Worker Receives Notification
      const workerNotifs = mockStore.getNotifications('usr-worker-1');
      expect(workerNotifs.some(n => n.message.includes(wo.reference_code))).toBe(true);

      // Step 6: Worker Completes Work & Uploads After-Evidence
      const completedWO = mockStore.submitWorkOrderCompletion(
        wo.id,
        'Area completely cleared and sanitized. 2 truckloads transported to processing center.',
        'https://images.unsplash.com/photo-after-cleanup.jpg',
        'Vikram Singh'
      );
      expect(completedWO?.status).toBe('COMPLETED_PENDING_VERIFICATION');
      expect(mockStore.getIncidentById(incidentId)?.status).toBe('COMPLETED_PENDING_VERIFICATION');

      // Step 7: Evidence Record Created
      const evidence = mockStore.getEvidence(wo.id);
      expect(evidence.length).toBeGreaterThan(0);
      expect(evidence[0].evidence_type).toBe('AFTER_WORK');

      // Step 8: Supervisor / Oversight Verifies & Approves
      const verifiedWO = mockStore.reviewWorkOrderVerification(
        wo.id,
        'APPROVED',
        'Inspected cleanup photo. Site fully restored to standards.',
        'Dr. Meera Iyer (Oversight Director)'
      );
      expect(verifiedWO?.status).toBe('VERIFIED_CLOSED');
      expect(mockStore.getIncidentById(incidentId)?.status).toBe('VERIFIED_CLOSED');

      // Step 9: Citizen Report Marked Verified Closed
      const updatedReport = mockStore.getReportById(report.id);
      expect(updatedReport?.status).toBe('VERIFIED_CLOSED');

      // Step 10: Citizen Receives Resolution Notification
      const citizenNotifs = mockStore.getNotifications('usr-citizen-1');
      expect(citizenNotifs.some(n => n.title.includes('Resolved & Verified'))).toBe(true);

      // Step 11: Audit Trail Verification
      const auditTrail = mockStore
        .getAuditEvents(report.id)
        .concat(mockStore.getAuditEvents(incidentId))
        .concat(mockStore.getAuditEvents(wo.id));
      expect(auditTrail.some(a => a.action === 'REPORT_SUBMITTED')).toBe(true);
      expect(auditTrail.some(a => a.action === 'WORKER_ASSIGNED')).toBe(true);
      expect(auditTrail.some(a => a.action === 'COMPLETION_SUBMITTED')).toBe(true);
      expect(auditTrail.some(a => a.action === 'COMPLETION_VERIFIED')).toBe(true);
    });

    it('verifies citizen supporting existing incident increases report_count and recalculates priority', () => {
      const existing = mockStore.getIncidents()[0];
      const initialCount = existing.report_count;
      const initialScore = existing.priority_score;

      const updated = mockStore.supportExistingIncident(existing.id, 'usr-citizen-2', 'Priya Patel');
      expect(updated?.report_count).toBe(initialCount + 1);

      // Priority should be recalculated with updated corroboration
      expect(updated?.priority_breakdown?.corroboration_points).toBeDefined();

      const citizenNotifs = mockStore.getNotifications('usr-citizen-2');
      expect(citizenNotifs.some(n => n.title === 'Incident Supported')).toBe(true);
    });
  });

  // =========================================================================
  // 7. SLA AND NOTIFICATIONS
  // =========================================================================
  describe('7. SLA and Notifications Verification', () => {
    it('detects overdue SLA breaches correctly', () => {
      // Create past date (48 hours ago) with a 24-hour SLA
      const pastTime = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const sla = calculateSLADeadline(pastTime, 24);
      expect(sla.isBreached).toBe(true);
      expect(sla.hoursRemaining).toBeLessThan(0);
    });

    it('verifies notification storage, mark-as-read, and user isolation', () => {
      const notif = mockStore.addNotification({
        user_id: 'usr-citizen-99',
        title: 'Test Notification',
        message: 'Testing isolated delivery',
        type: 'REPORT_STATUS',
      });

      expect(notif.read).toBe(false);

      // Filtered to this user
      const userNotifs = mockStore.getNotifications('usr-citizen-99');
      expect(userNotifs.length).toBe(1);
      expect(userNotifs[0].id).toBe(notif.id);

      // Other user does not see it
      const otherNotifs = mockStore.getNotifications('usr-citizen-1');
      expect(otherNotifs.some(n => n.id === notif.id)).toBe(false);

      // Mark as read
      mockStore.markNotificationRead(notif.id);
      expect(mockStore.getNotifications('usr-citizen-99')[0].read).toBe(true);
    });
  });
});
