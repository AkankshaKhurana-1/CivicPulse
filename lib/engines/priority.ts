import { IssueCategory, PriorityLevel, PriorityBreakdown, PriorityConfig } from '../types';

export interface PriorityCalculationOptions {
  description?: string;
  reportCount?: number;
  ageInHours?: number;
  isNearSensitiveAsset?: boolean;
  recurrenceCount?: number;
  evidenceConfidence?: number; // 0 to 1
  aiSeverityEstimate?: number; // 0 to 25
  emergencyOverride?: boolean;
  config?: PriorityConfig;
}

export interface PriorityScoreResult {
  score: number; // 0 to 100
  level: PriorityLevel;
  explanation: string;
  breakdown: PriorityBreakdown;
  acknowledgementHours: number;
  resolutionHours: number;
}

export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  weights: {
    severity: 25,
    safety_impact: 25,
    infrastructure: 15,
    recurrence: 10,
    age: 10,
    corroboration: 10,
    evidence: 5,
  },
  thresholds: {
    critical: 80,
    high: 60,
    medium: 35,
    low: 0,
  },
  emergency_keywords: [
    'open manhole',
    'missing manhole',
    'manhole cover missing',
    'exposed live wire',
    'live wire',
    'hanging electric wire',
    'fallen electric pole',
    'electric shock',
    'gas leak',
    'collapsing building',
    'collapsing wall',
    'sinkhole',
    'submerged electric transformer',
    'bridge crack',
  ],
};

// Base severity scale (0 to 25 max points)
const CATEGORY_BASE_SEVERITY: Record<IssueCategory, number> = {
  waterlogging: 24,
  blocked_drain: 23,
  pothole: 21,
  broken_streetlight: 17,
  damaged_footpath: 16,
  accessibility_barrier: 20,
  plastic_litter: 18,
  overflowing_waste: 16,
  damaged_road: 15,
  missed_waste_collection: 12,
  other: 10,
};

// Base safety & public impact scale (0 to 25 max points)
const CATEGORY_BASE_SAFETY_IMPACT: Record<IssueCategory, number> = {
  waterlogging: 24,
  blocked_drain: 22,
  pothole: 22,
  accessibility_barrier: 21,
  broken_streetlight: 18,
  damaged_footpath: 16,
  plastic_litter: 15,
  overflowing_waste: 14,
  damaged_road: 14,
  missed_waste_collection: 10,
  other: 8,
};

// Base infrastructure importance scale (0 to 15 max points)
const CATEGORY_INFRASTRUCTURE_IMPORTANCE: Record<IssueCategory, number> = {
  waterlogging: 15,
  blocked_drain: 14,
  pothole: 13,
  damaged_road: 12,
  accessibility_barrier: 12,
  broken_streetlight: 11,
  damaged_footpath: 10,
  plastic_litter: 9,
  overflowing_waste: 8,
  missed_waste_collection: 7,
  other: 5,
};

export function checkEmergencyOverride(
  description?: string,
  explicitOverride: boolean = false,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG
): { isOverride: boolean; reason?: string } {
  if (explicitOverride) {
    return {
      isOverride: true,
      reason: 'Emergency Safety Override explicitly triggered by municipal dispatcher.',
    };
  }

  if (!description) return { isOverride: false };

  const descLower = description.toLowerCase();
  for (const keyword of config.emergency_keywords) {
    if (descLower.includes(keyword)) {
      return {
        isOverride: true,
        reason: `Emergency Safety Override triggered: Detected immediate life hazard "${keyword}". Automatic escalation to Maximum Priority.`,
      };
    }
  }

  return { isOverride: false };
}

export function calculatePriorityScore(
  category: IssueCategory,
  reportCountOrOptions: number | PriorityCalculationOptions = 1,
  ageInHours: number = 0,
  isNearSensitiveAsset: boolean = false,
  explicitDescription?: string
): PriorityScoreResult {
  let opts: PriorityCalculationOptions;

  if (typeof reportCountOrOptions === 'number') {
    opts = {
      reportCount: reportCountOrOptions,
      ageInHours,
      isNearSensitiveAsset,
      description: explicitDescription,
    };
  } else {
    opts = reportCountOrOptions;
  }

  const config = opts.config || DEFAULT_PRIORITY_CONFIG;
  const reportCount = Math.max(opts.reportCount || 1, 1);
  const age = Math.max(opts.ageInHours || 0, 0);
  const isSensitive = opts.isNearSensitiveAsset || false;
  const recurrence = Math.max(opts.recurrenceCount || 0, 0);
  const evidenceConf = opts.evidenceConfidence !== undefined ? opts.evidenceConfidence : 0.9;

  // 1. Check for Emergency Overrides
  const emergencyCheck = checkEmergencyOverride(opts.description, opts.emergencyOverride, config);

  if (emergencyCheck.isOverride) {
    const breakdown: PriorityBreakdown = {
      severity_points: config.weights.severity,
      safety_impact_points: config.weights.safety_impact,
      infrastructure_points: config.weights.infrastructure,
      recurrence_points: config.weights.recurrence,
      age_points: config.weights.age,
      corroboration_points: config.weights.corroboration,
      evidence_confidence_points: config.weights.evidence,
      total_score: 100,
      is_emergency_override: true,
      emergency_reason: emergencyCheck.reason,
    };

    return {
      score: 100,
      level: 'CRITICAL',
      explanation: emergencyCheck.reason || 'Emergency Safety Override: Critical public safety hazard detected.',
      breakdown,
      acknowledgementHours: 1,
      resolutionHours: 6,
    };
  }

  // 2. Factor 1: Issue Severity (Max 25 pts)
  let severityPoints = CATEGORY_BASE_SEVERITY[category] || 12;
  if (opts.aiSeverityEstimate !== undefined) {
    // Combine base severity with AI suggestion (80% base, 20% AI suggestion)
    severityPoints = Math.round((severityPoints * 0.8 + Math.min(opts.aiSeverityEstimate, 25) * 0.2) * 10) / 10;
  }
  severityPoints = Math.min(Math.max(severityPoints, 5), config.weights.severity);

  // 3. Factor 2: Public Safety and Impact (Max 25 pts)
  let safetyImpactPoints = CATEGORY_BASE_SAFETY_IMPACT[category] || 10;
  if (isSensitive) {
    safetyImpactPoints = Math.min(safetyImpactPoints + 3, config.weights.safety_impact);
  }
  safetyImpactPoints = Math.min(Math.max(safetyImpactPoints, 5), config.weights.safety_impact);

  // 4. Factor 3: Infrastructure Importance (Max 15 pts)
  let infrastructurePoints = CATEGORY_INFRASTRUCTURE_IMPORTANCE[category] || 8;
  if (isSensitive) {
    infrastructurePoints = Math.min(infrastructurePoints + 2, config.weights.infrastructure);
  }
  infrastructurePoints = Math.min(Math.max(infrastructurePoints, 3), config.weights.infrastructure);

  // 5. Factor 4: Recurrence (Max 10 pts)
  // Repeat incidents at same asset or location add points
  const recurrencePoints = Math.min(Math.round(recurrence * 2.5 * 10) / 10, config.weights.recurrence);

  // 6. Factor 5: Incident Age (Max 10 pts)
  // Progressive urgency as hours elapsed without resolution (0.4 pts/hr up to 10 pts at 25h)
  const agePoints = Math.min(Math.round(age * 0.4 * 10) / 10, config.weights.age);

  // 7. Factor 6: Independent Report Corroboration (Max 10 pts)
  // Multiple independent citizen reports corroborate severity
  const corroborationPoints = Math.min(Math.round((reportCount - 1) * 2.5 * 10) / 10, config.weights.corroboration);

  // 8. Factor 7: Evidence Confidence (Max 5 pts)
  // High quality photo evidence and verified GPS accuracy adds up to 5 points
  const evidenceConfidencePoints = Math.min(Math.round(evidenceConf * config.weights.evidence * 10) / 10, config.weights.evidence);

  // Compute Total Weighted Score (0 - 100)
  const rawTotal =
    severityPoints +
    safetyImpactPoints +
    infrastructurePoints +
    recurrencePoints +
    agePoints +
    corroborationPoints +
    evidenceConfidencePoints;

  const totalScore = Math.min(Math.max(Math.round(rawTotal * 10) / 10, 5), 100);

  // Priority Level based on configurable thresholds
  let level: PriorityLevel = 'LOW';
  let acknowledgementHours = 24;
  let resolutionHours = 72;

  if (totalScore >= config.thresholds.critical) {
    level = 'CRITICAL';
    acknowledgementHours = 2;
    resolutionHours = 12;
  } else if (totalScore >= config.thresholds.high) {
    level = 'HIGH';
    acknowledgementHours = 4;
    resolutionHours = 24;
  } else if (totalScore >= config.thresholds.medium) {
    level = 'MEDIUM';
    acknowledgementHours = 12;
    resolutionHours = 48;
  } else {
    level = 'LOW';
    acknowledgementHours = 24;
    resolutionHours = 72;
  }

  const breakdown: PriorityBreakdown = {
    severity_points: severityPoints,
    safety_impact_points: safetyImpactPoints,
    infrastructure_points: infrastructurePoints,
    recurrence_points: recurrencePoints,
    age_points: agePoints,
    corroboration_points: corroborationPoints,
    evidence_confidence_points: evidenceConfidencePoints,
    total_score: totalScore,
    is_emergency_override: false,
  };

  const explanation = `Priority Score ${totalScore}/100 (${level}): Computed from Severity (${severityPoints}/25), Public Safety (${safetyImpactPoints}/25), Infrastructure (${infrastructurePoints}/15), Recurrence (${recurrencePoints}/10), Age (${agePoints}/10), Corroboration (${corroborationPoints}/10), and Evidence (${evidenceConfidencePoints}/5).`;

  return {
    score: totalScore,
    level,
    explanation,
    breakdown,
    acknowledgementHours,
    resolutionHours,
  };
}

export function calculateSLADeadline(
  createdAtIso: string,
  resolutionHours: number
): { dueIso: string; isBreached: boolean; hoursRemaining: number } {
  const created = new Date(createdAtIso).getTime();
  const due = new Date(created + resolutionHours * 60 * 60 * 1000);
  const now = new Date().getTime();

  const hoursRemaining = Math.round(((due.getTime() - now) / (1000 * 60 * 60)) * 10) / 10;
  const isBreached = now > due.getTime();

  return {
    dueIso: due.toISOString(),
    isBreached,
    hoursRemaining,
  };
}
