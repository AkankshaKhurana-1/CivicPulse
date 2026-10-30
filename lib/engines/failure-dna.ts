import {
  InfrastructureAsset,
  InfrastructureType,
  Incident,
  WorkOrder,
  RecurrenceEvent,
  RepairMonitoringRecord,
  RootCauseRecommendation,
  IssueCategory,
} from '../types';
import { calculateHaversineDistanceMeters } from './repair-accountability';

export const RECURRING_FAILURE_THRESHOLDS = {
  MIN_INCIDENTS_FOR_CHRONIC: 3,
  MIN_REPAIRS_FOR_CHRONIC: 2,
  MAX_DAYS_BETWEEN_REPAIRS_FOR_FAST_RECURRENCE: 45,
  DEFAULT_MONITORING_PERIOD_DAYS: 60,
  ASSET_MATCH_RADIUS_METERS: 150, // 150 meters proximity for physical asset linkage
};

/**
 * Determines whether a new incident belongs to an existing physical infrastructure asset
 * Supports both (incident, assets) and (lat, lng, category, desc, assets)
 */
export function findMatchingInfrastructureAsset(
  incidentOrLat: Incident | number,
  existingAssetsOrLng: InfrastructureAsset[] | number,
  categoryParam?: IssueCategory,
  titleOrDescParam?: string,
  existingAssetsParam?: InfrastructureAsset[]
): InfrastructureAsset | null {
  let targetLat: number;
  let targetLng: number;
  let targetCategory: string;
  let assets: InfrastructureAsset[] = [];

  if (typeof incidentOrLat === 'number') {
    targetLat = incidentOrLat;
    targetLng = existingAssetsOrLng as number;
    targetCategory = categoryParam || 'other';
    assets = existingAssetsParam || [];
  } else {
    targetLat = incidentOrLat.lat;
    targetLng = incidentOrLat.lng;
    targetCategory = incidentOrLat.category;
    assets = (existingAssetsOrLng as InfrastructureAsset[]) || [];
  }

  let bestMatch: InfrastructureAsset | null = null;
  let minDistance = Infinity;

  for (const asset of assets) {
    // 1. Must match category
    if (asset.category !== targetCategory) continue;

    // 2. Proximity check
    const dist = calculateHaversineDistanceMeters(asset.lat, asset.lng, targetLat, targetLng);
    if (dist <= RECURRING_FAILURE_THRESHOLDS.ASSET_MATCH_RADIUS_METERS) {
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = asset;
      }
    }
  }

  return bestMatch;
}

/**
 * Derives Infrastructure Type from category
 */
export function deriveInfrastructureType(category: IssueCategory): InfrastructureType {
  switch (category) {
    case 'pothole':
    case 'damaged_road':
    case 'damaged_footpath':
    case 'accessibility_barrier':
      return 'ROAD_SEGMENT';
    case 'blocked_drain':
    case 'waterlogging':
      return 'DRAINAGE_NETWORK';
    case 'broken_streetlight':
      return 'STREETLIGHT_CORRIDOR';
    case 'overflowing_waste':
    case 'plastic_litter':
    case 'missed_waste_collection':
    case 'other':
    default:
      return 'PUBLIC_FACILITY';
  }
}

/**
 * Creates a new physical infrastructure asset entity from an incident
 */
export function createInfrastructureAssetFromIncident(incident: Incident): InfrastructureAsset {
  const assetType = deriveInfrastructureType(incident.category);
  const now = new Date().toISOString();
  const shortId = `INF-${incident.city_id.replace('city-', '').toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  return {
    id: shortId,
    reference_code: shortId,
    name: `${incident.title} Asset Corridor`,
    city_id: incident.city_id,
    infrastructure_type: assetType,
    category: incident.category,
    lat: incident.lat,
    lng: incident.lng,
    address: incident.address,
    corridor_description: `Physical infrastructure asset registered at ${incident.address}.`,
    total_incidents: 1,
    total_repairs: 0,
    approved_repairs: 0,
    rejected_repairs: 0,
    repeat_incidents: 0,
    monitoring_status: 'FIRST_TIME_FAILURE',
    is_chronic_failure: false,
    failure_dna_summary: 'Initial infrastructure failure logged. Baseline asset profile established.',
    linked_incident_ids: [incident.id],
    last_incident_at: now,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Updates an infrastructure asset's failure DNA when a new incident is linked
 */
export function registerIncidentOnAsset(
  asset: InfrastructureAsset,
  incident: Incident,
  priorApprovedWorkOrders: WorkOrder[]
): {
  updatedAsset: InfrastructureAsset;
  recurrenceEvent?: RecurrenceEvent;
  recommendation?: RootCauseRecommendation;
} {
  const now = new Date().toISOString();
  asset.total_incidents += 1;
  asset.last_incident_at = incident.first_reported_at || now;
  if (!asset.linked_incident_ids.includes(incident.id)) {
    asset.linked_incident_ids.push(incident.id);
  }

  let recurrenceEvent: RecurrenceEvent | undefined;

  // Check if this incident represents a recurrence after an approved repair
  if (asset.approved_repairs > 0 && priorApprovedWorkOrders.length > 0) {
    // Find most recent approved repair
    const lastApprovedWO = priorApprovedWorkOrders
      .filter(w => w.status === 'VERIFIED_CLOSED' && w.verified_at)
      .sort((a, b) => new Date(b.verified_at!).getTime() - new Date(a.verified_at!).getTime())[0];

    if (lastApprovedWO && lastApprovedWO.verified_at) {
      const verifiedTime = new Date(lastApprovedWO.verified_at).getTime();
      const incidentTime = new Date(incident.first_reported_at || now).getTime();
      const daysDiff = Math.max(0, Math.round((incidentTime - verifiedTime) / (1000 * 60 * 60 * 24)));

      asset.repeat_incidents += 1;

      // Update average time to recurrence
      if (asset.average_time_to_recurrence_days) {
        asset.average_time_to_recurrence_days = Math.round(
          (asset.average_time_to_recurrence_days + daysDiff) / 2
        );
      } else {
        asset.average_time_to_recurrence_days = daysDiff;
      }

      asset.monitoring_status = 'RECURRENCE_DETECTED';

      recurrenceEvent = {
        id: `rec-${asset.id}-${Date.now()}`,
        infrastructure_id: asset.id,
        prior_work_order_id: lastApprovedWO.id,
        prior_verified_at: lastApprovedWO.verified_at,
        recurrence_incident_id: incident.id,
        recurrence_reported_at: incident.first_reported_at || now,
        days_between_repair_and_recurrence: daysDiff,
        distance_from_prior_repair_meters: calculateHaversineDistanceMeters(
          asset.lat,
          asset.lng,
          incident.lat,
          incident.lng
        ),
        failure_pattern_notes: `Failure recurred ${daysDiff} days after repair approval on ${new Date(
          lastApprovedWO.verified_at
        ).toLocaleDateString()}.`,
      };
    }
  }

  // Evaluate Chronic Recurring Failure Rules
  const isChronic =
    asset.total_incidents >= RECURRING_FAILURE_THRESHOLDS.MIN_INCIDENTS_FOR_CHRONIC &&
    asset.total_repairs >= RECURRING_FAILURE_THRESHOLDS.MIN_REPAIRS_FOR_CHRONIC &&
    asset.repeat_incidents >= 1;

  if (isChronic) {
    asset.is_chronic_failure = true;
    asset.monitoring_status = 'CHRONIC_FAILURE_ZONE';
    asset.failure_dna_summary = `CHRONIC RECURRING FAILURE: Location has sustained ${asset.total_incidents} incidents across ${asset.total_repairs} repair attempts with an average recurrence cycle of ${asset.average_time_to_recurrence_days || 30} days. Superficial patch repairs have repeatedly failed.`;
  }

  asset.updated_at = now;

  // Generate Root Cause Recommendation if chronic
  let recommendation: RootCauseRecommendation | undefined;
  if (asset.is_chronic_failure) {
    recommendation = generateRootCauseRecommendation(asset);
  }

  return {
    updatedAsset: asset,
    recurrenceEvent,
    recommendation,
  };
}

/**
 * Generates an explainable engineering root-cause recommendation
 */
export function generateRootCauseRecommendation(
  asset: InfrastructureAsset
): RootCauseRecommendation {
  let rootCauses: string[] = [];
  let recommendedAction = '';

  switch (asset.category) {
    case 'pothole':
    case 'damaged_road':
      rootCauses = [
        'Sub-base water saturation and inadequate roadside camber runoff causing repeated bitumen stripping.',
        'Heavy vehicular axle load exceeding current asphalt compaction rating.',
        'Previous cold-mix patch failed due to lack of tack-coat bonding and poor perimeter squaring.',
      ];
      recommendedAction =
        'Commission comprehensive road sub-base Core-drilling, inspect longitudinal storm drainage slope, and mandate high-compaction hot-mix resurfacing with bitumen emulsion seal.';
      break;

    case 'blocked_drain':
    case 'waterlogging':
      rootCauses = [
        'Stormwater trunk line bottleneck: culvert diameter insufficient for catchment area peak discharge.',
        'Severe siltation and un-intercepted upstream commercial waste accumulation.',
        'Negative slope gradient causing perpetual water stagnation and backflow.',
      ];
      recommendedAction =
        'Execute robotic camera pipeline audit, desilt trunk stormwater channel to foundation bed, and construct silt-trap screens at upstream municipal intersections.';
      break;

    case 'broken_streetlight':
      rootCauses = [
        'Underground electrical conduit moisture ingress causing recurrent short circuits during dew/rain.',
        'Phase voltage surges from local distribution transformer damaging LED driver modules.',
        'Corroded junction box terminals and improper earthing spike resistance.',
      ];
      recommendedAction =
        'Perform complete underground cable megger insulation test, install industrial-grade IP67 surge suppression units, and rewire junction box with waterproof heat-shrink terminations.';
      break;

    default:
      rootCauses = [
        'Repeated structural wear and tear exceeding standard cyclic maintenance intervals.',
        'Environmental stress factors and sub-optimal material durability.',
      ];
      recommendedAction =
        'Conduct formal multi-disciplinary engineering site inspection to formulate permanent structural remediation.';
      break;
  }

  return {
    id: `rec-${asset.id}-${Date.now()}`,
    infrastructure_id: asset.id,
    infrastructure_name: asset.name,
    observed_pattern: `Observed ${asset.total_incidents} incident cycles and ${asset.repeat_incidents} confirmed recurrences within an average interval of ${asset.average_time_to_recurrence_days || 25} days.`,
    supporting_incident_count: asset.total_incidents,
    previous_repair_count: asset.total_repairs,
    potential_root_causes: rootCauses,
    recommended_action: recommendedAction,
    severity: asset.total_incidents >= 3 ? 'CRITICAL' : 'HIGH',
    root_cause_explanation: rootCauses[0] || 'Sub-base structural breakdown.',
    recommended_agency:
      asset.category === 'pothole' || asset.category === 'damaged_road'
        ? 'PWD (Public Works Department Highway Division)'
        : asset.category === 'blocked_drain' || asset.category === 'waterlogging'
        ? 'Municipal Corporation (Drainage Division)'
        : 'Punjab State Power Corp (Electricity Board)',
    confidence: 0.91,
    status: 'PENDING_ENGINEER_REVIEW',
    created_at: new Date().toISOString(),
  };
}
