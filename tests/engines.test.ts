import { describe, it, expect } from 'vitest';
import { routeIssueToAgency } from '../lib/engines/routing';
import { calculatePriorityScore, calculateSLADeadline, checkEmergencyOverride } from '../lib/engines/priority';
import { calculateDistanceMeters, findDuplicateIncidents, evaluateDuplicateMatch, calculateGeographicSimilarity } from '../lib/engines/duplicates';
import { buildDependencyChain } from '../lib/engines/dependency';
import { suggestCategoryAndTitle, verifyWorkEvidence, calculateTextSemanticSimilarity, calculateImageVisualSimilarity } from '../lib/engines/ai-adapter';
import { SEED_INCIDENTS, SEED_DEPENDENCY_LINKS } from '../lib/db/seed-data';

describe('Agency Routing Engine', () => {
  it('should route plastic litter in New Delhi to MCD Sanitation', () => {
    const decision = routeIssueToAgency('plastic_litter', 'city-delhi');
    expect(decision.agency.code).toBe('MCD-WASTE');
    expect(decision.confidence).toBeGreaterThanOrEqual(0.9);
    expect(decision.isProvisional).toBe(false);
  });

  it('should route pothole in New Delhi to PWD', () => {
    const decision = routeIssueToAgency('pothole', 'city-delhi');
    expect(decision.agency.code).toBe('PWD-DEL');
  });

  it('should route waterlogging to Delhi Jal Board', () => {
    const decision = routeIssueToAgency('waterlogging', 'city-delhi');
    expect(decision.agency.code).toBe('DJB-DRAIN');
  });
});

describe('Module 1: Advanced Priority Engine (7 Weighted Factors & Emergency Overrides)', () => {
  it('should assign CRITICAL priority (score >= 80) to waterlogging with multiple reports', () => {
    const result = calculatePriorityScore('waterlogging', 5, 12, true);
    expect(result.level).toBe('CRITICAL');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.acknowledgementHours).toBe(2);
    expect(result.resolutionHours).toBe(12);
    expect(result.breakdown.severity_points).toBeGreaterThan(20);
    expect(result.breakdown.safety_impact_points).toBeGreaterThan(20);
  });

  it('should trigger emergency override for open manholes and exposed live wires', () => {
    const manholeResult = calculatePriorityScore('blocked_drain', {
      description: 'Danger! Open manhole on main road without cover near school gate.',
      reportCount: 1,
    });

    expect(manholeResult.score).toBe(100);
    expect(manholeResult.level).toBe('CRITICAL');
    expect(manholeResult.breakdown.is_emergency_override).toBe(true);
    expect(manholeResult.explanation).toContain('Emergency Safety Override');

    const wireResult = calculatePriorityScore('broken_streetlight', {
      description: 'Exposed live wire hanging from broken streetlight pole.',
      reportCount: 1,
    });
    expect(wireResult.score).toBe(100);
    expect(wireResult.breakdown.is_emergency_override).toBe(true);
  });

  it('should calculate SLA deadlines correctly', () => {
    const nowIso = new Date().toISOString();
    const sla = calculateSLADeadline(nowIso, 24);
    expect(sla.isBreached).toBe(false);
    expect(sla.hoursRemaining).toBeGreaterThan(23);
  });
});

describe('Module 2 & 3: Intelligent Duplicate Detection & GPS Accuracy Matching', () => {
  it('should calculate distance between two coordinates correctly', () => {
    // Distance between two close points in New Delhi ~100m
    const dist = calculateDistanceMeters(28.6280, 77.2190, 28.6282, 77.2193);
    expect(dist).toBeGreaterThan(10);
    expect(dist).toBeLessThan(100);
  });

  it('should trigger 100% geographic similarity for 5-meter difference', () => {
    const geoSim = calculateGeographicSimilarity(4.5, 30);
    expect(geoSim).toBe(100);
  });

  it('should find duplicate candidates using the hybrid 5-signal formula and dynamic re-normalization', () => {
    const candidate = evaluateDuplicateMatch(
      {
        category: 'plastic_litter',
        lat: 28.6281,
        lng: 77.2191,
        accuracyMeters: 10,
        description: 'Commercial plastic garbage and single use waste piled up on slip road',
        timestamp: '2026-10-01T09:00:00Z',
      },
      SEED_INCIDENTS[0]
    );

    expect(candidate).not.toBeNull();
    if (candidate) {
      expect(candidate.duplicate_score).toBeGreaterThanOrEqual(70);
      expect(candidate.geo_similarity).toBeGreaterThan(80);
      expect(candidate.signals_used).toContain('Geographic Proximity (40%)');
      expect(candidate.signals_used).toContain('Semantic Text (30%)');
    }
  });

  it('should re-normalize weights when image is not provided without failing', () => {
    const matches = findDuplicateIncidents('plastic_litter', 28.6281, 77.2191, SEED_INCIDENTS, 200);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].incident.id).toBe('inc-001');
  });
});

describe('Infrastructure Chain Dependency Solver', () => {
  it('should build 3-level dependency chain from plastic dump to waterlogging to pothole', () => {
    const chain = buildDependencyChain('inc-001', SEED_INCIDENTS, SEED_DEPENDENCY_LINKS);
    expect(chain.length).toBe(4); // inc-001 -> inc-002 -> inc-003 -> inc-004
    expect(chain[0].incident.id).toBe('inc-001');
    expect(chain[1].incident.id).toBe('inc-002');
    expect(chain[2].incident.id).toBe('inc-003');
    expect(chain[3].incident.id).toBe('inc-004');
  });
});

describe('Module 4: Multilingual NLP & AI Smart Adapter', () => {
  it('should suggest plastic_litter category for English and Hindi text', async () => {
    const enRes = await suggestCategoryAndTitle('Massive commercial plastic dumping on roadside');
    expect(enRes.suggestedCategory).toBe('plastic_litter');
    expect(enRes.confidence).toBeGreaterThan(0.85);

    const hiRes = await suggestCategoryAndTitle('सड़क पर भारी प्लास्टिक और कूड़ा जमा है');
    expect(hiRes.suggestedCategory).toBe('plastic_litter');
    expect(hiRes.detectedLanguage).toBe('hi');
  });

  it('should compute text semantic cosine similarity accurately', () => {
    const sim = calculateTextSemanticSimilarity(
      'Severe waterlogging and flooded traffic lane',
      'Arterial road waterlogging with flooded vehicles'
    );
    expect(sim).toBeGreaterThanOrEqual(40);
  });

  it('should flag duplicate images in evidence verification', async () => {
    const sameUrl = 'https://images.unsplash.com/photo-1530587191325-3db32d826c18';
    const res = await verifyWorkEvidence(sameUrl, sameUrl, 'Done');
    expect(res.passed).toBe(false);
    expect(res.flags).toContain('REUSED_IMAGE_DETECTED');
  });
});
