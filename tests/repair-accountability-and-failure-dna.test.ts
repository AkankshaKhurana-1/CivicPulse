import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateHaversineDistanceMeters,
  evaluateImageQuality,
  analyzeRepairEvidence,
} from '@/lib/engines/repair-accountability';
import {
  findMatchingInfrastructureAsset,
  deriveInfrastructureType,
  createInfrastructureAssetFromIncident,
  registerIncidentOnAsset,
  generateRootCauseRecommendation,
} from '@/lib/engines/failure-dna';
import { mockStore } from '@/lib/db/mock-store';
import { Incident, Evidence, WorkOrder, InfrastructureAsset } from '@/lib/types';

describe('AI-Powered Repair Accountability Engine & Infrastructure Failure DNA', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('Module A: Haversine Distance & Image Quality', () => {
    it('calculates accurate distance between coordinates', () => {
      // Coordinates ~100m apart
      const lat1 = 30.7700;
      const lng1 = 76.5750;
      const lat2 = 30.7708;
      const lng2 = 76.5755;

      const distance = calculateHaversineDistanceMeters(lat1, lng1, lat2, lng2);
      expect(distance).toBeGreaterThan(90);
      expect(distance).toBeLessThan(120);
    });

    it('returns 0 distance for identical coordinates', () => {
      const dist = calculateHaversineDistanceMeters(30.77, 76.575, 30.77, 76.575);
      expect(dist).toBe(0);
    });

    it('evaluates image quality and flags low resolution or missing data', () => {
      const highQualityEv: Evidence = {
        id: 'ev-test-1',
        work_order_id: 'wo-1',
        uploader_id: 'usr-1',
        uploader_role: 'worker',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=1200&q=80',
        evidence_type: 'AFTER_WORK',
        captured_at: new Date().toISOString(),
        uploaded_at: new Date().toISOString(),
        perceptual_hash: 'a1b2c3d4e5f60011',
      };

      const highQualityScore = evaluateImageQuality(highQualityEv);
      expect(highQualityScore.score).toBeGreaterThanOrEqual(75);

      const missingScore = evaluateImageQuality(undefined);
      expect(missingScore.score).toBe(0);
    });
  });

  describe('Module A: AI Repair Evidence Analysis', () => {
    const mockIncident: Incident = {
      id: 'inc-test-01',
      reference_code: 'INC-2026-001',
      title: 'Pothole on Main Road',
      description: 'Dangerous pothole near zebra crossing',
      category: 'pothole',
      priority_score: 75,
      priority_level: 'HIGH',
      status: 'UNDER_TRIAGE',
      lat: 30.7700,
      lng: 76.5750,
      address: 'Main Highway near Gate 2',
      jurisdiction_id: 'jur-1',
      city_id: 'city-1',
      report_count: 3,
      first_reported_at: new Date().toISOString(),
      last_observed_at: new Date().toISOString(),
      linked_report_ids: ['rep-1'],
    };

    const beforeEvidence: Evidence = {
      id: 'ev-before-1',
      work_order_id: 'wo-test-1',
      uploader_id: 'usr-citizen-1',
      uploader_role: 'citizen',
      url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000',
      evidence_type: 'INITIAL_REPORT',
      captured_at: new Date().toISOString(),
      uploaded_at: new Date().toISOString(),
      lat: 30.7700,
      lng: 76.5750,
      perceptual_hash: 'hash-initial-1111',
    };

    it('produces ACCEPTABLE_EVIDENCE when photos are high quality, verified on-site, and visually cleared', () => {
      const validAfterEvidence: Evidence = {
        id: 'ev-after-1',
        work_order_id: 'wo-test-1',
        uploader_id: 'usr-worker-1',
        uploader_role: 'worker',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=1000',
        evidence_type: 'AFTER_WORK',
        captured_at: new Date().toISOString(),
        uploaded_at: new Date().toISOString(),
        lat: 30.77005, // ~6 meters away
        lng: 76.57502,
        perceptual_hash: 'hash-after-unique-2222',
      };

      const analysis = analyzeRepairEvidence(
        'wo-test-1',
        mockIncident,
        beforeEvidence,
        validAfterEvidence,
        [beforeEvidence, validAfterEvidence]
      );

      expect(analysis.verification_outcome).toBe('ACCEPTABLE_EVIDENCE');
      expect(analysis.location_matched).toBe(true);
      expect(analysis.duplicate_check?.is_duplicate).toBe(false);
      expect(analysis.photo_quality_score).toBeGreaterThanOrEqual(60);
      expect(analysis.statutory_limitations_notice).toBeDefined();
    });

    it('produces INSUFFICIENT_EVIDENCE when completion photo is missing or blurry', () => {
      const analysis = analyzeRepairEvidence(
        'wo-test-1',
        mockIncident,
        beforeEvidence,
        undefined, // Missing after evidence
        [beforeEvidence]
      );

      expect(analysis.verification_outcome).toBe('INSUFFICIENT_EVIDENCE');
      expect(analysis.explanation).toContain('Insufficient');
    });

    it('produces LOCATION_MISMATCH when repair photo is taken far beyond accuracy buffer (>150m)', () => {
      const farOffAfterEvidence: Evidence = {
        id: 'ev-after-far',
        work_order_id: 'wo-test-1',
        uploader_id: 'usr-worker-1',
        uploader_role: 'worker',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=1000',
        evidence_type: 'AFTER_WORK',
        captured_at: new Date().toISOString(),
        uploaded_at: new Date().toISOString(),
        lat: 30.7750, // ~570 meters away
        lng: 76.5790,
        perceptual_hash: 'hash-after-far-3333',
      };

      const analysis = analyzeRepairEvidence(
        'wo-test-1',
        mockIncident,
        beforeEvidence,
        farOffAfterEvidence,
        [beforeEvidence, farOffAfterEvidence]
      );

      expect(analysis.verification_outcome).toBe('LOCATION_MISMATCH');
      expect(analysis.location_matched).toBe(false);
      expect(analysis.distance_meters).toBeGreaterThan(150);
    });

    it('detects duplicate photo reuse via perceptual hash comparison', () => {
      const reusedAfterEvidence: Evidence = {
        id: 'ev-after-reused',
        work_order_id: 'wo-test-1',
        uploader_id: 'usr-worker-1',
        uploader_role: 'worker',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=1000',
        evidence_type: 'AFTER_WORK',
        captured_at: new Date().toISOString(),
        uploaded_at: new Date().toISOString(),
        lat: 30.77001,
        lng: 76.57501,
        perceptual_hash: 'hash-initial-1111', // Exact same hash as initial report!
      };

      const analysis = analyzeRepairEvidence(
        'wo-test-1',
        mockIncident,
        beforeEvidence,
        reusedAfterEvidence,
        [beforeEvidence, reusedAfterEvidence]
      );

      expect(analysis.verification_outcome).toBe('POSSIBLE_DUPLICATE_EVIDENCE');
      expect(analysis.duplicate_check.is_duplicate).toBe(true);
    });
  });

  describe('Module B & D: Human Supervisor Verification & 60-Day Monitoring', () => {
    it('approves verification: marks VERIFIED_CLOSED, starts 60-day monitoring, and updates asset history', () => {
      const woId = 'wo-cu-03';
      const supervisorName = 'Dr. Meera Iyer (Oversight Director)';

      const updatedWO = mockStore.reviewWorkOrderVerification(
        woId,
        'APPROVED',
        'Independent oversight approved repair evidence.',
        supervisorName
      );

      expect(updatedWO).toBeDefined();
      expect(updatedWO?.status).toBe('VERIFIED_CLOSED');
      expect(updatedWO?.verified_at).toBeDefined();

      // Check asset monitoring status
      const asset = mockStore.getInfrastructureAssetById('INF-CHD-001');
      expect(asset).toBeDefined();
      expect(asset?.monitoring_status).toBe('REPAIRED_UNDER_MONITORING');

      // Check monitoring record created
      const monitoringRecords = mockStore.getRepairMonitoringRecords('INF-CHD-001');
      expect(monitoringRecords.length).toBeGreaterThanOrEqual(1);
      expect(monitoringRecords[0].monitoring_days_configured).toBe(60);
      expect(monitoringRecords[0].status).toBe('UNDER_MONITORING');
    });

    it('rejects verification: sets REJECTED_COMPLETION and returns work order for worker rework', () => {
      const woId = 'wo-cu-03';
      const reason = 'Cold-mix asphalt patch was not properly compacted and edges are loose.';

      const updatedWO = mockStore.reviewWorkOrderVerification(
        woId,
        'REJECTED',
        reason,
        'Dr. Meera Iyer'
      );

      expect(updatedWO?.status).toBe('REJECTED_COMPLETION');
      expect(updatedWO?.rejection_reason).toBe(reason);

      // Verify notification sent to field worker
      const notifications = mockStore.getNotifications('usr-worker-1');
      const rejectionNotif = notifications.find(n => n.title.includes('Evidence Rejected'));
      expect(rejectionNotif).toBeDefined();
    });

    it('requests additional evidence: sets NEEDS_INFORMATION and keeps incident IN_PROGRESS', () => {
      const woId = 'wo-cu-03';
      const notes = 'Please take a wider angle photo showing the milestone to verify exact spot.';

      const updatedWO = mockStore.reviewWorkOrderVerification(
        woId,
        'NEEDS_MORE_EVIDENCE',
        notes,
        'Dr. Meera Iyer'
      );

      expect(updatedWO?.status).toBe('NEEDS_INFORMATION');
      expect(updatedWO?.rejection_reason).toBe(notes);
    });
  });

  describe('Module C & E: Infrastructure Failure DNA & Chronic Failure Intelligence', () => {
    it('matches an incident to an existing asset within 150m and identical category', () => {
      const existingAssets = mockStore.getInfrastructureAssets();
      const nh95Asset = existingAssets.find(a => a.id === 'INF-CHD-001');
      expect(nh95Asset).toBeDefined();

      const matched = findMatchingInfrastructureAsset(
        30.7702, // ~30m from NH-95 corridor
        76.5752,
        'pothole',
        'pothole on NH-95 highway',
        existingAssets
      );

      expect(matched).toBeDefined();
      expect(matched?.id).toBe('INF-CHD-001');
    });

    it('does NOT match nearby incidents if category is different (e.g. street light vs pothole)', () => {
      const existingAssets = mockStore.getInfrastructureAssets();

      // Street light at the exact same coordinates as NH-95 pothole asset
      const matched = findMatchingInfrastructureAsset(
        30.7700,
        76.5750,
        'street_light',
        'Broken sodium vapor lamp',
        existingAssets
      );

      // Should not conflate a street light with a road corridor asset!
      expect(matched).toBeFalsy();
    });

    it('detects recurring failure rule (>=3 incidents, >=2 repairs) and flags chronic failure', () => {
      const asset = mockStore.getInfrastructureAssetById('INF-CHD-001');
      expect(asset).toBeDefined();
      expect(asset?.failure_count).toBeGreaterThanOrEqual(3);
      expect(asset?.repair_count).toBeGreaterThanOrEqual(2);
      expect(asset?.recurrence_count).toBeGreaterThanOrEqual(2);
      expect(asset?.is_chronic_failure).toBe(true);
      expect(asset?.average_recurrence_days).toBe(25);
    });

    it('generates a root cause recommendation for chronic failures with engineering specificity', () => {
      const asset = mockStore.getInfrastructureAssetById('INF-CHD-001')!;
      const rec = generateRootCauseRecommendation(asset);

      expect(rec).toBeDefined();
      expect(rec?.severity).toBe('CRITICAL');
      expect(rec?.root_cause_explanation).toContain('Sub-base water saturation');
      expect(rec?.recommended_action).toContain('Core-drilling');
      expect(rec?.recommended_agency).toContain('PWD');
    });
  });

  describe('Module F: Root Cause Inspection Conversion', () => {
    it('converts a recommendation into an official Maintenance Inspection', () => {
      const recs = mockStore.getRootCauseRecommendations('INF-CHD-001');
      expect(recs.length).toBeGreaterThan(0);
      const rec = recs[0];

      const scheduledDate = '2026-11-05';
      const inspection = mockStore.convertRecommendationToInspection(
        rec.id,
        scheduledDate,
        'Executive Engineer site visit authorized.'
      );

      expect(inspection).toBeDefined();
      expect(inspection?.recommendation_id).toBe(rec.id);
      expect(inspection?.infrastructure_id).toBe('INF-CHD-001');
      expect(inspection?.status).toBe('SCHEDULED');
      expect(inspection?.assigned_engineer_name).toContain('Harpreet Singh');

      // Verify recommendation status updated
      const updatedRecs = mockStore.getRootCauseRecommendations('INF-CHD-001');
      const updatedRec = updatedRecs.find(r => r.id === rec.id);
      expect(updatedRec?.status).toBe('CONVERTED_TO_INSPECTION_WORK_ORDER');
      expect(updatedRec?.converted_work_order_id).toBe(inspection?.id);
    });
  });
});
