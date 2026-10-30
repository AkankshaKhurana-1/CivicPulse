'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Incident, InfrastructureAsset, IssueCategory, PriorityLevel, ReportStatus } from '@/lib/types';
import { PriorityBadge, StatusBadge } from '../dashboard/StatusBadge';
import { MapSearch } from './MapSearch';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import {
  MAP_CITIES,
  TILE_LAYERS,
  CATEGORY_MAP_VISUALS,
  PRIORITY_COLORS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  getOpenStreetMapDirectionsUrl,
} from './MapConfig';
import {
  createIncidentDivIcon,
  createIncidentPopupHtml,
  createInfrastructureAssetDivIcon,
  createInfrastructureAssetPopupHtml,
} from './IncidentMarker';
import {
  MapPin,
  Layers,
  List,
  Map as MapIcon,
  AlertTriangle,
  Compass,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  Eye,
} from 'lucide-react';

export interface CivicMapProps {
  incidents?: Incident[];
  infrastructureAssets?: InfrastructureAsset[];
  selectedIncidentId?: string;
  onSelectIncident?: (incident: Incident) => void;
  selectedAssetId?: string;
  onSelectAsset?: (asset: InfrastructureAsset) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showLegend?: boolean;
}

export function CivicMap({
  incidents = [],
  infrastructureAssets = [],
  selectedIncidentId,
  onSelectIncident,
  selectedAssetId,
  onSelectAsset,
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  className = '',
  showSearch = true,
  showFilters = true,
  showLegend = true,
}: CivicMapProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [activeAsset, setActiveAsset] = useState<InfrastructureAsset | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'osm_standard' | 'carto_positron'>('osm_standard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Filters inside map
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'CHRONIC_ONLY' | 'INCIDENTS_ONLY'>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const assetsGroupRef = useRef<any>(null);
  const searchHighlightRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter incidents based on category, priority, status, and selected city
  const filteredIncidents = useMemo(() => {
    if (assetFilter === 'CHRONIC_ONLY') return [];

    return incidents.filter(inc => {
      if (categoryFilter !== 'ALL' && inc.category !== categoryFilter) return false;
      if (priorityFilter !== 'ALL' && inc.priority_level !== priorityFilter) return false;
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;

      // City filter approximation by bounding box
      if (selectedCity !== 'all') {
        const cityConfig = MAP_CITIES[selectedCity];
        if (cityConfig) {
          const dLat = Math.abs(inc.lat - cityConfig.center[0]);
          const dLng = Math.abs(inc.lng - cityConfig.center[1]);
          if (dLat > 0.4 || dLng > 0.4) return false;
        }
      }

      return true;
    });
  }, [incidents, categoryFilter, priorityFilter, statusFilter, selectedCity, assetFilter]);

  // Filter infrastructure assets
  const filteredAssets = useMemo(() => {
    if (assetFilter === 'INCIDENTS_ONLY') return [];

    return infrastructureAssets.filter(asset => {
      if (assetFilter === 'CHRONIC_ONLY' && !asset.is_chronic_failure) return false;
      if (categoryFilter !== 'ALL' && asset.category !== categoryFilter) return false;

      if (selectedCity !== 'all') {
        const cityConfig = MAP_CITIES[selectedCity];
        if (cityConfig) {
          const dLat = Math.abs(asset.lat - cityConfig.center[0]);
          const dLng = Math.abs(asset.lng - cityConfig.center[1]);
          if (dLat > 0.4 || dLng > 0.4) return false;
        }
      }

      return true;
    });
  }, [infrastructureAssets, assetFilter, categoryFilter, selectedCity]);

  // Handle Layer Switching (OSM standard raster <-> CartoDB OSM clean)
  const toggleLayer = useCallback(() => {
    if (!leafletMapRef.current || !tileLayerRef.current || !LRef.current) return;
    const nextLayer = activeLayer === 'osm_standard' ? 'carto_positron' : 'osm_standard';
    setActiveLayer(nextLayer);

    leafletMapRef.current.removeLayer(tileLayerRef.current);
    const layerConfig = TILE_LAYERS[nextLayer] || TILE_LAYERS.osm_standard;
    tileLayerRef.current = LRef.current.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
    }).addTo(leafletMapRef.current);
  }, [activeLayer]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Invalidate size observer
  useEffect(() => {
    if (!leafletMapRef.current || !mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      leafletMapRef.current?.invalidateSize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [viewMode]);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!mounted || !mapContainerRef.current) return;
    let isCancelled = false;

    async function initLeaflet() {
      try {
        const L = (await import('leaflet')).default;
        LRef.current = L;

        // Ensure Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (isCancelled || !mapContainerRef.current) return;

        // Initialize map instance if not exists
        if (!leafletMapRef.current) {
          const map = L.map(mapContainerRef.current, {
            center,
            zoom,
            zoomControl: false,
          });

          const layerConfig = TILE_LAYERS[activeLayer] || TILE_LAYERS.osm_standard;
          tileLayerRef.current = L.tileLayer(layerConfig.url, {
            attribution: layerConfig.attribution,
            maxZoom: layerConfig.maxZoom,
          }).addTo(map);

          leafletMapRef.current = map;
          markersGroupRef.current = L.layerGroup().addTo(map);
          assetsGroupRef.current = L.layerGroup().addTo(map);
        }

        const map = leafletMapRef.current;
        const markersGroup = markersGroupRef.current;
        const assetsGroup = assetsGroupRef.current;

        if (markersGroup) markersGroup.clearLayers();
        if (assetsGroup) assetsGroup.clearLayers();

        // 1. Render Infrastructure Assets
        filteredAssets.forEach(asset => {
          const isSelected = selectedAssetId === asset.id || activeAsset?.id === asset.id;
          const assetIcon = createInfrastructureAssetDivIcon(L, asset, isSelected);
          const assetMarker = L.marker([asset.lat, asset.lng], { icon: assetIcon });

          assetMarker.bindPopup(createInfrastructureAssetPopupHtml(asset), { maxWidth: 300 });
          assetMarker.on('click', () => {
            setActiveAsset(asset);
            setActiveIncident(null);
            if (onSelectAsset) onSelectAsset(asset);
          });

          assetsGroup.addLayer(assetMarker);
        });

        // 2. Render Incident Markers with Proximity Clustering when zoomed out
        const zoomLevel = map.getZoom();
        const shouldCluster = zoomLevel < 12 && filteredIncidents.length > 15;

        if (shouldCluster) {
          const clusters: Array<{ lat: number; lng: number; incidents: Incident[] }> = [];
          const threshold = 0.04;

          filteredIncidents.forEach(inc => {
            let placed = false;
            for (const cluster of clusters) {
              const dLat = Math.abs(cluster.lat - inc.lat);
              const dLng = Math.abs(cluster.lng - inc.lng);
              if (dLat < threshold && dLng < threshold) {
                cluster.incidents.push(inc);
                cluster.lat = (cluster.lat + inc.lat) / 2;
                cluster.lng = (cluster.lng + inc.lng) / 2;
                placed = true;
                break;
              }
            }
            if (!placed) {
              clusters.push({ lat: inc.lat, lng: inc.lng, incidents: [inc] });
            }
          });

          clusters.forEach(cluster => {
            if (cluster.incidents.length === 1) {
              renderSingleIncidentMarker(L, markersGroup, cluster.incidents[0]);
            } else {
              const clusterIcon = L.divIcon({
                className: 'civic-cluster-badge',
                html: `
                  <div style="
                    background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 3px solid rgba(255,255,255,0.9);
                    box-shadow: 0 4px 14px rgba(13, 148, 136, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 13px;
                    cursor: pointer;
                  ">
                    ${cluster.incidents.length}
                  </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
              });

              const clusterMarker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon });
              clusterMarker.on('click', () => {
                map.flyTo([cluster.lat, cluster.lng], map.getZoom() + 3, { duration: 0.8 });
              });
              clusterMarker.bindPopup(`
                <div style="font-family: inherit; font-size: 12px; padding: 4px;">
                  <b>Cluster: ${cluster.incidents.length} Incidents</b><br>
                  <span style="font-size: 11px; color: #475569;">Click cluster badge to zoom in</span>
                </div>
              `);
              markersGroup.addLayer(clusterMarker);
            }
          });
        } else {
          filteredIncidents.forEach(inc => {
            renderSingleIncidentMarker(L, markersGroup, inc);
          });
        }

        // 3. Render User GPS location pin if located
        if (userLocation) {
          const userIcon = L.divIcon({
            className: 'user-gps-pin',
            html: `
              <div style="
                background: #0d9488;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 14px #0d9488;
              "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
          userMarker.bindPopup(`<b>Your Verified Location</b><br>Accuracy: ±${userLocation.accuracy}m`);
          markersGroup.addLayer(userMarker);

          const circle = L.circle([userLocation.lat, userLocation.lng], {
            radius: userLocation.accuracy,
            color: '#0d9488',
            fillColor: '#2dd4bf',
            fillOpacity: 0.15,
            weight: 1.5,
          });
          markersGroup.addLayer(circle);
        }
      } catch (err) {
        console.error('Leaflet initialization error:', err);
      }
    }

    initLeaflet();

    return () => {
      isCancelled = true;
    };
  }, [mounted, filteredIncidents, filteredAssets, userLocation, center, zoom, selectedIncidentId, selectedAssetId]);

  // Helper to render individual incident marker
  const renderSingleIncidentMarker = (L: any, group: any, inc: Incident) => {
    const isSelected = selectedIncidentId === inc.id || activeIncident?.id === inc.id;
    const customIcon = createIncidentDivIcon(L, inc, isSelected);
    const marker = L.marker([inc.lat, inc.lng], { icon: customIcon });

    marker.bindPopup(createIncidentPopupHtml(inc), { maxWidth: 280 });
    marker.on('click', () => {
      setActiveIncident(inc);
      setActiveAsset(null);
      if (onSelectIncident) onSelectIncident(inc);
    });

    group.addLayer(marker);
  };

  // Center on Selected Incident
  useEffect(() => {
    if (selectedIncidentId && leafletMapRef.current) {
      const inc = incidents.find(i => i.id === selectedIncidentId);
      if (inc) {
        leafletMapRef.current.flyTo([inc.lat, inc.lng], 16, { duration: 1.2 });
        setActiveIncident(inc);
      }
    }
  }, [selectedIncidentId, incidents]);

  // Center on Selected Infrastructure Asset
  useEffect(() => {
    if (selectedAssetId && leafletMapRef.current) {
      const asset = infrastructureAssets.find(a => a.id === selectedAssetId);
      if (asset) {
        leafletMapRef.current.flyTo([asset.lat, asset.lng], 16, { duration: 1.2 });
        setActiveAsset(asset);
      }
    }
  }, [selectedAssetId, infrastructureAssets]);

  // Handle City Presets
  const handleCitySelect = (cityKey: string) => {
    setSelectedCity(cityKey);
    if (cityKey === 'all') {
      if (leafletMapRef.current) {
        leafletMapRef.current.flyTo(center, zoom, { duration: 1.0 });
      }
      return;
    }
    const cityConfig = MAP_CITIES[cityKey];
    if (cityConfig && leafletMapRef.current) {
      leafletMapRef.current.flyTo(cityConfig.center, cityConfig.zoom, { duration: 1.2 });
    }
  };

  // Handle Location Selected from Search Bar
  const handleSelectSearchResult = (location: {
    lat: number;
    lng: number;
    name: string;
    displayName: string;
  }) => {
    if (!leafletMapRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = leafletMapRef.current;

    map.flyTo([location.lat, location.lng], 16, { duration: 1.4 });

    if (searchHighlightRef.current) {
      map.removeLayer(searchHighlightRef.current);
    }

    const highlightCircle = L.circle([location.lat, location.lng], {
      radius: 180,
      color: '#0d9488',
      fillColor: '#14b8a6',
      fillOpacity: 0.25,
      weight: 2,
    }).addTo(map);

    searchHighlightRef.current = highlightCircle;

    L.popup()
      .setLatLng([location.lat, location.lng])
      .setContent(
        `<div style="font-family: inherit; font-size: 12px; padding: 2px;">
          <b>${location.name}</b><br>
          <span style="font-size:11px;color:#475569;">${location.displayName}</span>
        </div>`
      )
      .openOn(map);
  };

  // Locate Me Action
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false);
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy) || 20,
        };
        setUserLocation(loc);
        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([loc.lat, loc.lng], 15, { duration: 1.2 });
        }
      },
      err => {
        setIsLocating(false);
        console.warn('Geolocation failed:', err);
        alert('Could not retrieve your location.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleZoomIn = () => leafletMapRef.current?.zoomIn();
  const handleZoomOut = () => leafletMapRef.current?.zoomOut();
  const handleResetView = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(center, zoom, { duration: 1.0 });
    }
  };

  if (!mounted) {
    return (
      <div
        className={`w-full h-full min-h-[500px] bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 ${className}`}
      >
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading OpenStreetMap Geospatial Civic Canvas...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[550px] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl flex flex-col ${className}`}
    >
      {/* Top Map Control Bar */}
      <div className="bg-navy-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 z-20 text-white">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="font-bold text-slate-100 hidden sm:inline">OpenStreetMap Civic Pulse</span>
            <span className="text-[11px] font-mono text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/30">
              {filteredIncidents.length + filteredAssets.length} Mapped Assets
            </span>
          </div>

          {/* City Quick Selector */}
          <div className="flex items-center space-x-1 text-xs">
            <select
              value={selectedCity}
              onChange={e => handleCitySelect(e.target.value)}
              className="bg-navy-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Municipalities</option>
              <option value="city-chandigarh">Chandigarh / Mohali</option>
              <option value="city-delhi">New Delhi</option>
              <option value="city-ludhiana">Ludhiana</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-navy-800 border border-slate-700 rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('split')}
              className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'split' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition ${
                viewMode === 'map' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition ${
                viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-navy-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(CATEGORY_MAP_VISUALS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.emoji} {val.label}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="bg-navy-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical (80-100)</option>
              <option value="HIGH">High (60-79)</option>
              <option value="MEDIUM">Medium (35-59)</option>
              <option value="LOW">Low (0-34)</option>
            </select>

            {/* Infrastructure Failure DNA Filter */}
            <select
              value={assetFilter}
              onChange={e => setAssetFilter(e.target.value as any)}
              className="bg-navy-800 border border-slate-700 text-purple-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="ALL">All Layers (Incidents + Assets)</option>
              <option value="CHRONIC_ONLY">⚡ Chronic Failure Zones Only</option>
              <option value="INCIDENTS_ONLY">Incidents Only</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Map Body */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden min-h-[480px]">
        {/* Incident List Drawer (Visible in 'split' or 'list' mode) */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div
            className={`${
              viewMode === 'list' ? 'w-full flex-1' : 'w-full md:w-80 h-72 md:h-auto md:max-h-[580px]'
            } bg-navy-900/95 border-b md:border-b-0 md:border-r border-slate-800 p-3 overflow-y-auto space-y-2.5 z-10 shrink-0`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
              <span>Incident & Asset Queue</span>
              <span className="font-mono text-[10px]">
                {filteredIncidents.length + filteredAssets.length} Found
              </span>
            </div>

            {/* Infrastructure Assets section if present */}
            {filteredAssets.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Infrastructure Failure DNA ({filteredAssets.length})</span>
                </span>
                {filteredAssets.map(asset => {
                  const isSelected = activeAsset?.id === asset.id || selectedAssetId === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        setActiveAsset(asset);
                        setActiveIncident(null);
                        if (onSelectAsset) onSelectAsset(asset);
                        if (leafletMapRef.current) {
                          leafletMapRef.current.flyTo([asset.lat, asset.lng], 16, { duration: 1 });
                        }
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-950/90 border-purple-500 shadow-lg ring-1 ring-purple-500'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white line-clamp-1">{asset.name}</span>
                        {asset.is_chronic_failure && (
                          <span className="text-[9px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.2 rounded">
                            Chronic
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 font-mono">
                        {asset.asset_code} | {asset.failure_count} breakdowns
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredIncidents.length === 0 && filteredAssets.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No incidents or infrastructure assets match the active filters or city selection.
              </div>
            ) : (
              filteredIncidents.map(inc => {
                const visual = CATEGORY_MAP_VISUALS[inc.category] || CATEGORY_MAP_VISUALS.other;
                const isSelected = activeIncident?.id === inc.id || selectedIncidentId === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setActiveIncident(inc);
                      setActiveAsset(null);
                      if (onSelectIncident) onSelectIncident(inc);
                      if (leafletMapRef.current) {
                        leafletMapRef.current.flyTo([inc.lat, inc.lng], 16, { duration: 1 });
                      }
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-950/90 border-teal-500 shadow-lg ring-1 ring-teal-500'
                        : 'bg-navy-800/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-100 line-clamp-1 flex items-center space-x-1">
                        <span>{visual.emoji}</span>
                        <span>{inc.title}</span>
                      </span>
                      <PriorityBadge level={inc.priority_level} />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{inc.address}</p>
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
                      <StatusBadge status={inc.status} size="sm" />
                      <span className="text-teal-300 font-mono font-bold">
                        Score: {inc.priority_score}/100
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Leaflet Map Canvas (Visible in 'split' or 'map' mode) */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className="flex-1 relative w-full h-full min-h-[350px] sm:min-h-[420px] md:min-h-[480px]">
            {/* Embedded Floating Map Search */}
            {showSearch && (
              <div className="absolute top-3 left-3 right-16 sm:right-auto sm:w-80 md:w-96 z-20">
                <MapSearch
                  onSelectLocation={handleSelectSearchResult}
                  placeholder="Search landmark, university, sector (e.g. Chandigarh University)..."
                />
              </div>
            )}

            {/* Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full min-h-[350px] sm:min-h-[420px] md:min-h-[480px] z-0" />

            {/* Floating Map Controls */}
            <MapControls
              className="absolute top-3 right-3"
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onLocateMe={handleLocateMe}
              isLocating={isLocating}
              onToggleLayer={toggleLayer}
              currentLayer={TILE_LAYERS[activeLayer]?.name}
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              onResetView={handleResetView}
            />

            {/* Floating Map Legend (Bottom-Left) */}
            {showLegend && (
              <div className="absolute bottom-4 left-4 z-20">
                <MapLegend defaultExpanded={false} />
              </div>
            )}

            {/* Active Marker Floating Preview Card */}
            {activeIncident && (
              <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96 bg-navy-900/95 border border-teal-500/60 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md z-[500] animate-in fade-in slide-in-from-bottom-2 max-h-[75vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest font-bold flex items-center space-x-1">
                      <span>{CATEGORY_MAP_VISUALS[activeIncident.category]?.emoji}</span>
                      <span>{activeIncident.category.replace('_', ' ')}</span>
                    </span>
                    <h4 className="font-bold text-sm text-white mt-0.5">{activeIncident.title}</h4>
                  </div>
                  <PriorityBadge level={activeIncident.priority_level} />
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-3">{activeIncident.description}</p>

                {activeIncident.is_emergency_override && (
                  <div className="mb-2 p-2 bg-red-950/80 border border-red-500/50 rounded-lg text-[11px] text-red-200 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="font-bold">Emergency Override: Critical Safety Hazard</span>
                  </div>
                )}

                <div className="bg-navy-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono mb-3">
                  <div>📍 Location: {activeIncident.address}</div>
                  <div>🎯 Priority Score: {activeIncident.priority_score}/100</div>
                  <div>⏱ Corroboration: {activeIncident.report_count} Verified Submissions</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                  <StatusBadge status={activeIncident.status} size="sm" />
                  <div className="flex items-center space-x-2">
                    <a
                      href={getOpenStreetMapDirectionsUrl(activeIncident.lat, activeIncident.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center space-x-1 border border-slate-700 transition"
                      title="Open navigation via OpenStreetMap OSRM"
                    >
                      <Compass className="w-3.5 h-3.5 text-teal-400" />
                      <span className="hidden sm:inline">OSM Directions</span>
                    </a>
                    <Link
                      href={`/issues/${activeIncident.id}`}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center space-x-1 shadow transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
