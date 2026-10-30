import { IssueCategory, Incident, DuplicateCandidate } from '../types';
import { calculateTextSemanticSimilarity, calculateImageVisualSimilarity } from './ai-adapter';

export interface DuplicateCheckInput {
  category: IssueCategory;
  lat: number;
  lng: number;
  accuracyMeters?: number;
  description?: string;
  imageUrl?: string;
  timestamp?: string;
}

// Haversine formula to compute distance in meters between two lat/lng points
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Related category similarity matrix
const RELATED_CATEGORIES: Record<IssueCategory, IssueCategory[]> = {
  plastic_litter: ['overflowing_waste', 'blocked_drain'],
  overflowing_waste: ['plastic_litter', 'missed_waste_collection'],
  blocked_drain: ['waterlogging', 'plastic_litter'],
  waterlogging: ['blocked_drain', 'pothole'],
  pothole: ['damaged_road', 'waterlogging'],
  damaged_road: ['pothole', 'damaged_footpath'],
  damaged_footpath: ['damaged_road', 'accessibility_barrier'],
  accessibility_barrier: ['damaged_footpath'],
  broken_streetlight: ['damaged_road'],
  missed_waste_collection: ['overflowing_waste'],
  other: [],
};

export function calculateCategorySimilarity(cat1: IssueCategory, cat2: IssueCategory): number {
  if (cat1 === cat2) return 100;
  if (RELATED_CATEGORIES[cat1]?.includes(cat2) || RELATED_CATEGORIES[cat2]?.includes(cat1)) {
    return 60;
  }
  return 10;
}

export function calculateTimeSimilarity(time1Iso?: string, time2Iso?: string): number {
  if (!time1Iso || !time2Iso) return 50;

  const t1 = new Date(time1Iso).getTime();
  const t2 = new Date(time2Iso).getTime();
  if (isNaN(t1) || isNaN(t2)) return 50;

  const diffHours = Math.abs(t1 - t2) / (1000 * 3600);

  if (diffHours <= 2) return 100;
  if (diffHours <= 12) return 90;
  if (diffHours <= 24) return 75;
  if (diffHours <= 72) return 50;
  if (diffHours <= 168) return 30; // within 1 week
  return 10;
}

export function calculateGeographicSimilarity(distanceMeters: number, candidateRadius: number): number {
  // A difference of 5 meters or less triggers maximum similarity
  if (distanceMeters <= 5) return 100;

  if (distanceMeters <= candidateRadius) {
    // 100 down to 70 within candidate accuracy radius
    return Math.round(100 - (distanceMeters / candidateRadius) * 30);
  }

  if (distanceMeters <= candidateRadius * 2) {
    // 70 down to 35 within double candidate radius
    return Math.round(70 - ((distanceMeters - candidateRadius) / candidateRadius) * 35);
  }

  if (distanceMeters <= 250) {
    // 35 down to 5 up to 250m
    return Math.max(5, Math.round(35 - ((distanceMeters - candidateRadius * 2) / (250 - candidateRadius * 2)) * 30));
  }

  return 0;
}

/**
 * Hybrid 5-Signal Duplicate Detection Formula:
 * Duplicate Score = 0.40 * Geo + 0.30 * Text + 0.15 * Category + 0.10 * Image + 0.05 * Time
 * If signals are unavailable, dynamically re-normalizes weights across available signals.
 */
export function evaluateDuplicateMatch(
  input: DuplicateCheckInput,
  incident: Incident,
  existingImageUrl?: string
): DuplicateCandidate | null {
  const acc1 = input.accuracyMeters || 15;
  const acc2 = 15; // default existing incident accuracy
  const candidateRadius = Math.max(15, acc1 + acc2);

  const distance = calculateDistanceMeters(input.lat, input.lng, incident.lat, incident.lng);

  // Maximum spatial boundary for candidate evaluation: 300 meters or candidateRadius * 3
  if (distance > Math.max(300, candidateRadius * 3)) {
    return null;
  }

  // 1. Geographic Similarity (0 - 100)
  const geoScore = calculateGeographicSimilarity(distance, candidateRadius);

  // 2. Text Similarity (0 - 100)
  const textScore = input.description
    ? calculateTextSemanticSimilarity(input.description, incident.description || incident.title)
    : 50;

  // 3. Category Similarity (0 - 100)
  const categoryScore = calculateCategorySimilarity(input.category, incident.category);

  // 4. Image Similarity (Optional signal)
  const imageScore = calculateImageVisualSimilarity(input.imageUrl, existingImageUrl);

  // 5. Time Similarity (Optional signal)
  const timeScore = calculateTimeSimilarity(input.timestamp, incident.first_reported_at);

  // Dynamic Re-normalization across available signals
  const baseWeights = {
    geo: 0.40,
    text: 0.30,
    category: 0.15,
    image: 0.10,
    time: 0.05,
  };

  const signalsUsed: string[] = ['Geographic Proximity (40%)', 'Semantic Text (30%)', 'Issue Category (15%)'];
  let totalAvailableWeight = baseWeights.geo + baseWeights.text + baseWeights.category;

  if (imageScore !== null) {
    totalAvailableWeight += baseWeights.image;
    signalsUsed.push('Perceptual Image Hash (10%)');
  }

  if (input.timestamp && incident.first_reported_at) {
    totalAvailableWeight += baseWeights.time;
    signalsUsed.push('Time Proximity (5%)');
  }

  // Renormalize weights
  const wGeo = baseWeights.geo / totalAvailableWeight;
  const wText = baseWeights.text / totalAvailableWeight;
  const wCat = baseWeights.category / totalAvailableWeight;
  const wImg = imageScore !== null ? baseWeights.image / totalAvailableWeight : 0;
  const wTime = input.timestamp && incident.first_reported_at ? baseWeights.time / totalAvailableWeight : 0;

  const duplicateScore = Math.round(
    wGeo * geoScore +
    wText * textScore +
    wCat * categoryScore +
    (imageScore !== null ? wImg * imageScore : 0) +
    (wTime > 0 ? wTime * timeScore : 0)
  );

  let recommendation: 'STRONG_DUPLICATE' | 'POSSIBLE_DUPLICATE' | 'SEPARATE_ISSUE' = 'SEPARATE_ISSUE';
  if (duplicateScore >= 80) {
    recommendation = 'STRONG_DUPLICATE';
  } else if (duplicateScore >= 60) {
    recommendation = 'POSSIBLE_DUPLICATE';
  }

  const reason =
    recommendation === 'STRONG_DUPLICATE'
      ? `Strong duplicate match (${duplicateScore}%): Located ${distance}m away (radius: ${candidateRadius}m) with high semantic and category correlation.`
      : recommendation === 'POSSIBLE_DUPLICATE'
      ? `Possible duplicate match (${duplicateScore}%): Nearby active incident within ${distance}m requiring officer review.`
      : `Separate issue: Low overall duplicate score (${duplicateScore}%).`;

  return {
    incident,
    distance_meters: distance,
    candidate_radius: candidateRadius,
    geo_similarity: geoScore,
    text_similarity: textScore,
    category_similarity: categoryScore,
    image_similarity: imageScore !== null ? imageScore : undefined,
    time_similarity: timeScore,
    duplicate_score: duplicateScore,
    recommendation,
    signals_used: signalsUsed,
    reason,
  };
}

/**
 * Searches for duplicate candidates with backwards compatibility for legacy signature:
 * findDuplicateIncidents(category, lat, lng, existingIncidents, radiusMeters)
 */
export function findDuplicateIncidents(
  categoryOrInput: IssueCategory | DuplicateCheckInput,
  latOrExisting?: number | Incident[],
  lngOrRadius?: number,
  existingIncidentsList?: Incident[],
  legacyRadiusMeters: number = 250
): DuplicateCandidate[] {
  let input: DuplicateCheckInput;
  let incidents: Incident[];

  if (typeof categoryOrInput === 'object') {
    input = categoryOrInput;
    incidents = (latOrExisting as Incident[]) || [];
  } else {
    input = {
      category: categoryOrInput,
      lat: (latOrExisting as number) || 0,
      lng: lngOrRadius || 0,
      accuracyMeters: 15,
      timestamp: new Date().toISOString(),
    };
    incidents = existingIncidentsList || [];
  }

  const matches: DuplicateCandidate[] = [];

  for (const incident of incidents) {
    if (incident.status === 'VERIFIED_CLOSED') continue;

    const candidate = evaluateDuplicateMatch(input, incident);
    if (candidate && candidate.duplicate_score >= 50) {
      matches.push(candidate);
    }
  }

  return matches.sort((a, b) => b.duplicate_score - a.duplicate_score);
}
