import { IssueCategory, Agency, Jurisdiction } from '../types';
import { SEED_AGENCIES } from '../db/seed-data';

export interface RoutingDecision {
  agency: Agency;
  confidence: number; // 0.0 to 1.0
  isProvisional: boolean;
  reason: string;
}

export function routeIssueToAgency(
  category: IssueCategory,
  cityId: string,
  jurisdictionId?: string,
  agenciesList: Agency[] = SEED_AGENCIES
): RoutingDecision {
  // Filter agencies for this city
  const cityAgencies = agenciesList.filter(a => a.city_id === cityId && a.active);

  if (cityAgencies.length === 0) {
    const fallbackAgency = agenciesList[0];
    return {
      agency: fallbackAgency,
      confidence: 0.5,
      isProvisional: true,
      reason: 'No city-specific agency rule found. Routed to default municipal triage queue.',
    };
  }

  // Exact category coverage match
  const matchingAgencies = cityAgencies.filter(a => a.category_coverage.includes(category));

  if (matchingAgencies.length === 1) {
    const agency = matchingAgencies[0];
    return {
      agency,
      confidence: 0.95,
      isProvisional: false,
      reason: `Direct statutory match: ${agency.name} (${agency.code}) holds designated responsibility for ${category.replace('_', ' ')}.`,
    };
  }

  if (matchingAgencies.length > 1) {
    // Multiple agencies cover category - require officer triage decision
    const primaryAgency = matchingAgencies[0];
    return {
      agency: primaryAgency,
      confidence: 0.70,
      isProvisional: true,
      reason: `Shared jurisdiction between ${matchingAgencies.map(a => a.name).join(' & ')}. Marked provisional for Human Triage.`,
    };
  }

  // Fallback match
  const defaultAgency = cityAgencies[0];
  return {
    agency: defaultAgency,
    confidence: 0.50,
    isProvisional: true,
    reason: `Unmatched category ${category}. Assigned provisionally to ${defaultAgency.name} for human officer triage.`,
  };
}
