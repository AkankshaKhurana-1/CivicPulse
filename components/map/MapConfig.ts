import {
  IssueCategory,
  PriorityLevel,
  ReportStatus,
  InfrastructureType,
} from '@/lib/types';
import {
  MAP_CITIES,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  TileLayerConfig,
  TILE_LAYERS as BASE_TILE_LAYERS,
  CATEGORY_MAP_VISUALS,
  PRIORITY_COLORS,
  STATUS_BORDER_COLORS,
  MapCityCenter,
  CategoryMapVisual,
} from '@/lib/maps/map-config';

export {
  MAP_CITIES,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  CATEGORY_MAP_VISUALS,
  PRIORITY_COLORS,
  STATUS_BORDER_COLORS,
};

export type { MapCityCenter, TileLayerConfig, CategoryMapVisual };

/**
 * Open-Source Tile Layer Providers
 *
 * POLICY NOTICE:
 * 1. OpenStreetMap standard tiles (tile.openstreetmap.org) are provided for free by the
 *    OpenStreetMap Foundation under their Tile Usage Policy.
 *    Attribution requirement: "© OpenStreetMap contributors"
 * 2. In production with high traffic, self-hosting tiles (e.g. TileServer GL, OpenMapTiles,
 *    Protomaps PMTiles) or using free-tier providers (Stadia Maps OSM, CARTO, MapTiler free tier)
 *    is recommended to prevent overloading public OSM servers.
 * 3. Never use proprietary/paid APIs (Google Maps, Mapbox paid services).
 */
export const TILE_LAYERS: Record<string, TileLayerConfig> = {
  osm_standard: {
    name: 'OpenStreetMap Standard (Free OSM)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  carto_positron: {
    name: 'Clean Street (OSM Voyager)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  carto_dark: {
    name: 'Night Mode (OSM Dark Matter)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
};

/**
 * Returns a 100% Free & Open-Source Turn-by-Turn Navigation Link using OpenStreetMap OSRM routing.
 * No proprietary Google Maps API needed.
 */
export function getOpenStreetMapDirectionsUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${lat}%2C${lng}`;
}

/**
 * Visual styling rules for Infrastructure Failure DNA Assets plotted on the map
 */
export interface InfrastructureMapVisual {
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
  isPulsing: boolean;
}

export const INFRASTRUCTURE_ASSET_VISUALS: Record<string, InfrastructureMapVisual> = {
  CHRONIC_FAILURE_ZONE: {
    borderColor: '#991B1B', // Dark red
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    badgeText: 'Chronic Failure Zone',
    icon: '⚡',
    isPulsing: true,
  },
  REPEAT_FAILURE: {
    borderColor: '#D97706', // Amber
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    badgeText: 'Recurrent Asset',
    icon: '🔄',
    isPulsing: false,
  },
  ACTIVE_MONITORING: {
    borderColor: '#2563EB', // Blue
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    badgeText: '60-Day Monitoring',
    icon: '🛡️',
    isPulsing: false,
  },
};
