import { Incident, InfrastructureAsset } from '@/lib/types';
import {
  CATEGORY_MAP_VISUALS,
  PRIORITY_COLORS,
  STATUS_BORDER_COLORS,
  INFRASTRUCTURE_ASSET_VISUALS,
  getOpenStreetMapDirectionsUrl,
} from './MapConfig';

/**
 * Creates an interactive Leaflet DivIcon for an Incident
 */
export function createIncidentDivIcon(L: any, inc: Incident, isSelected: boolean = false): any {
  const visual = CATEGORY_MAP_VISUALS[inc.category] || CATEGORY_MAP_VISUALS.other;
  const priorityColor = PRIORITY_COLORS[inc.priority_level] || '#3B82F6';
  const statusBorder = STATUS_BORDER_COLORS[inc.status] || '#64748B';
  const isCritical = inc.priority_level === 'CRITICAL';

  const markerSize = isSelected ? 42 : isCritical ? 38 : 34;
  const pulseSize = markerSize + 14;

  return L.divIcon({
    className: `civic-incident-pin ${isSelected ? 'selected-pin' : ''}`,
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${pulseSize}px;
        height: ${pulseSize}px;
        transform: translate(-50%, -50%);
      ">
        ${
          isCritical || isSelected
            ? `<div style="
                position: absolute;
                width: ${pulseSize}px;
                height: ${pulseSize}px;
                border-radius: 50%;
                background: ${isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(2, 132, 199, 0.35)'};
                animation: pulse 1.8s infinite;
              "></div>`
            : ''
        }
        <div style="
          background: ${priorityColor};
          width: ${markerSize}px;
          height: ${markerSize}px;
          border-radius: 50%;
          border: ${isSelected ? '3px solid #FFFFFF' : `2.5px solid ${statusBorder}`};
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: ${isSelected ? '17px' : '15px'};
          cursor: pointer;
          position: relative;
          z-index: 10;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
          <span>${visual.emoji}</span>
        </div>
      </div>
    `,
    iconSize: [pulseSize, pulseSize],
    iconAnchor: [pulseSize / 2, pulseSize / 2],
    popupAnchor: [0, -pulseSize / 2],
  });
}

/**
 * Creates clean, accessible popup HTML for an Incident
 */
export function createIncidentPopupHtml(inc: Incident): string {
  const visual = CATEGORY_MAP_VISUALS[inc.category] || CATEGORY_MAP_VISUALS.other;
  const priorityColor = PRIORITY_COLORS[inc.priority_level] || '#3B82F6';
  const directionsUrl = getOpenStreetMapDirectionsUrl(inc.lat, inc.lng);

  return `
    <div style="font-family: inherit; font-size: 12px; min-width: 230px; max-width: 280px; color: #0f172a; padding: 2px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0d9488; letter-spacing: 0.5px;">
          ${visual.emoji} ${visual.label}
        </span>
        <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${priorityColor}20; color: ${priorityColor}; border: 1px solid ${priorityColor}50;">
          ${inc.priority_level}
        </span>
      </div>

      <div style="font-weight: 800; font-size: 13px; margin-bottom: 4px; line-height: 1.25; color: #0f172a;">
        ${inc.title}
      </div>

      <div style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.3;">
        📍 ${inc.address || 'Reported Location'}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 10px;">
        <span style="font-weight: 700; color: ${priorityColor};">
          Priority Score: ${inc.priority_score}/100
        </span>
        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #334155; font-weight: 600;">
          ${inc.report_count} Reports
        </span>
      </div>

      <div style="margin-top: 8px; display: flex; gap: 6px;">
        <a href="/issues/${inc.id}" style="
          flex: 1;
          text-align: center;
          background: #0284c7;
          color: white;
          font-weight: 700;
          padding: 6px 8px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 11px;
          display: inline-block;
          transition: background 0.15s;
        ">
          View Details
        </a>
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="
          background: #f1f5f9;
          color: #334155;
          font-weight: 700;
          padding: 6px 8px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
        " title="Open navigation via OpenStreetMap OSRM">
          🧭 Directions
        </a>
      </div>
    </div>
  `;
}

/**
 * Creates an interactive Leaflet DivIcon for an Infrastructure Failure DNA Asset
 */
export function createInfrastructureAssetDivIcon(
  L: any,
  asset: InfrastructureAsset,
  isSelected: boolean = false
): any {
  const isChronic = asset.is_chronic_failure;
  const config = isChronic
    ? INFRASTRUCTURE_ASSET_VISUALS.CHRONIC_FAILURE_ZONE
    : INFRASTRUCTURE_ASSET_VISUALS.REPEAT_FAILURE;

  const size = isSelected ? 42 : isChronic ? 38 : 34;
  const pulseSize = size + 16;
  const failureCount = asset.failure_count ?? asset.total_incidents ?? 0;

  return L.divIcon({
    className: `civic-asset-pin ${isSelected ? 'selected-pin' : ''}`,
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${pulseSize}px;
        height: ${pulseSize}px;
        transform: translate(-50%, -50%);
      ">
        ${
          isChronic || isSelected
            ? `<div style="
                position: absolute;
                width: ${pulseSize}px;
                height: ${pulseSize}px;
                border-radius: 50%;
                background: rgba(220, 38, 38, 0.4);
                animation: pulse 1.6s infinite;
              "></div>`
            : ''
        }
        <div style="
          background: ${isChronic ? '#991B1B' : '#B45309'};
          width: ${size}px;
          height: ${size}px;
          border-radius: 10px;
          border: ${isSelected ? '3px solid #FFFFFF' : '2.5px solid #FEF08A'};
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 15px;
          cursor: pointer;
          position: relative;
          z-index: 10;
        ">
          <span>${config.icon}</span>
          ${
            failureCount > 1
              ? `<span style="
                  position: absolute;
                  top: -6px;
                  right: -6px;
                  background: #DC2626;
                  color: white;
                  font-size: 9px;
                  font-weight: 900;
                  border-radius: 6px;
                  padding: 1px 4px;
                  border: 1px solid white;
                ">${failureCount}x</span>`
              : ''
          }
        </div>
      </div>
    `,
    iconSize: [pulseSize, pulseSize],
    iconAnchor: [pulseSize / 2, pulseSize / 2],
    popupAnchor: [0, -pulseSize / 2],
  });
}

/**
 * Creates clean, accessible popup HTML for an Infrastructure Failure DNA Asset
 */
export function createInfrastructureAssetPopupHtml(asset: InfrastructureAsset): string {
  const directionsUrl = getOpenStreetMapDirectionsUrl(asset.lat, asset.lng);
  const isChronic = asset.is_chronic_failure;
  const failureCount = asset.failure_count ?? asset.total_incidents ?? 0;
  const repairCount = asset.repair_count ?? asset.total_repairs ?? 0;
  const recurrenceCount = asset.recurrence_count ?? asset.repeat_incidents ?? 0;
  const assetCode = asset.asset_code || asset.reference_code || 'ASSET';

  return `
    <div style="font-family: inherit; font-size: 12px; min-width: 250px; max-width: 300px; color: #0f172a; padding: 2px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #7c3aed; letter-spacing: 0.5px;">
          🧬 Infrastructure Failure DNA
        </span>
        <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; ${
          isChronic
            ? 'background: #fee2e2; color: #dc2626; border: 1px solid #f87171;'
            : 'background: #fef3c7; color: #b45309; border: 1px solid #fcd34d;'
        }">
          ${isChronic ? 'CHRONIC ZONE' : 'RECURRENT'}
        </span>
      </div>

      <div style="font-weight: 800; font-size: 13px; margin-bottom: 4px; line-height: 1.25; color: #0f172a;">
        ${asset.name}
      </div>

      <div style="font-size: 11px; color: #475569; margin-bottom: 6px; font-mono: monospace;">
        Code: <strong>${assetCode}</strong> | ${asset.category.replace('_', ' ')}
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; font-size: 11px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="color: #64748b;">Failure Cycles:</span>
          <span style="font-weight: 800; color: #b91c1c;">${failureCount} breakdowns</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="color: #64748b;">Repairs Completed:</span>
          <span style="font-weight: 700;">${repairCount}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">Post-Repair Recurrences:</span>
          <span style="font-weight: 800; color: #dc2626;">${recurrenceCount}</span>
        </div>
      </div>

      <div style="display: flex; gap: 6px;">
        <a href="/infrastructure/${asset.id}" style="
          flex: 1;
          text-align: center;
          background: #7c3aed;
          color: white;
          font-weight: 700;
          padding: 6px 8px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 11px;
          display: inline-block;
        ">
          Inspect Failure DNA
        </a>
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="
          background: #f1f5f9;
          color: #334155;
          font-weight: 700;
          padding: 6px 8px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
        " title="Open navigation via OpenStreetMap">
          🧭 Directions
        </a>
      </div>
    </div>
  `;
}
