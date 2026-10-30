import { IssueCategory, PriorityLevel, ReportStatus } from '../types';

export interface MapCityCenter {
  id: string;
  name: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
}

export const MAP_CITIES: Record<string, MapCityCenter> = {
  'city-delhi': {
    id: 'city-delhi',
    name: 'New Delhi',
    center: [28.6139, 77.2090],
    zoom: 12,
  },
  'city-chandigarh': {
    id: 'city-chandigarh',
    name: 'Chandigarh / Mohali',
    center: [30.7333, 76.7794],
    zoom: 12,
  },
  'city-ludhiana': {
    id: 'city-ludhiana',
    name: 'Ludhiana',
    center: [30.9010, 75.8573],
    zoom: 13,
  },
};

export const DEFAULT_MAP_CENTER: [number, number] = [28.6139, 77.2090];
export const DEFAULT_MAP_ZOOM = 12;

export interface TileLayerConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export const TILE_LAYERS: Record<string, TileLayerConfig> = {
  carto_positron: {
    name: 'Clean Street (CartoDB)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  osm_standard: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

export interface CategoryMapVisual {
  color: string;
  emoji: string;
  label: string;
}

export const CATEGORY_MAP_VISUALS: Record<IssueCategory, CategoryMapVisual> = {
  pothole: { color: '#EA580C', emoji: '🕳️', label: 'Pothole' },
  waterlogging: { color: '#0284C7', emoji: '🌊', label: 'Waterlogging' },
  blocked_drain: { color: '#0D9488', emoji: '🚰', label: 'Blocked Drain' },
  plastic_litter: { color: '#16A34A', emoji: '🗑️', label: 'Plastic Litter' },
  overflowing_waste: { color: '#D97706', emoji: '📦', label: 'Overflowing Waste' },
  broken_streetlight: { color: '#CA8A04', emoji: '💡', label: 'Broken Streetlight' },
  damaged_footpath: { color: '#7C3AED', emoji: '🚶', label: 'Damaged Footpath' },
  accessibility_barrier: { color: '#E11D48', emoji: '♿', label: 'Accessibility Barrier' },
  damaged_road: { color: '#475569', emoji: '🚧', label: 'Damaged Road' },
  missed_waste_collection: { color: '#059669', emoji: '🚛', label: 'Missed Collection' },
  other: { color: '#64748B', emoji: '⚠️', label: 'Other Hazard' },
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  CRITICAL: '#EF4444', // Red (with pulsing ring)
  HIGH: '#F97316',     // Orange
  MEDIUM: '#F59E0B',   // Amber
  LOW: '#3B82F6',      // Blue
};

export const STATUS_BORDER_COLORS: Record<ReportStatus, string> = {
  SUBMITTED: '#64748B',
  LINKED_TO_INCIDENT: '#0284C7',
  UNDER_TRIAGE: '#3B82F6',
  ASSIGNED: '#F59E0B',
  IN_PROGRESS: '#8B5CF6',
  COMPLETED_PENDING_VERIFICATION: '#EAB308',
  VERIFIED_CLOSED: '#10B981',
  REOPENED: '#EF4444',
  REJECTED: '#94A3B8',
  ESCALATED: '#DC2626',
};
