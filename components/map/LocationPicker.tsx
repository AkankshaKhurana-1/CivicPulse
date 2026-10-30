'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Crosshair,
  Sparkles,
  Compass,
  Check,
} from 'lucide-react';
import { MapSearch } from './MapSearch';
import { MapControls } from './MapControls';
import { reverseGeocodeLocation } from '@/lib/maps/geocoding';
import { TILE_LAYERS, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from './MapConfig';

export interface LocationPickerValue {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  accuracy?: number;
  locationSource?: 'search' | 'gps' | 'manual_pin';
  isConfirmed?: boolean;
}

interface LocationPickerProps {
  initialLocation?: LocationPickerValue;
  onLocationConfirm: (location: LocationPickerValue) => void;
  className?: string;
}

export function LocationPicker({
  initialLocation,
  onLocationConfirm,
  className = '',
}: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLocation?.lat || DEFAULT_MAP_CENTER[0],
    lng: initialLocation?.lng || DEFAULT_MAP_CENTER[1],
  });
  const [address, setAddress] = useState<string>(
    initialLocation?.address || 'Detecting address...'
  );
  const [city, setCity] = useState<string | undefined>(initialLocation?.city);
  const [accuracy, setAccuracy] = useState<number | undefined>(initialLocation?.accuracy);
  const [locationSource, setLocationSource] = useState<'search' | 'gps' | 'manual_pin'>(
    initialLocation?.locationSource || 'manual_pin'
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(initialLocation?.isConfirmed || false);
  const [activeLayer, setActiveLayer] = useState<'osm_standard' | 'carto_positron'>('osm_standard');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  // Trigger initial mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reverse geocode whenever coordinates change
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const data = await reverseGeocodeLocation(lat, lng);
      if (data && data.displayName) {
        setAddress(data.displayName);
        if (data.city) setCity(data.city);
      } else {
        setAddress(`Location (${lat.toFixed(5)}°, ${lng.toFixed(5)}°)`);
      }
    } catch {
      setAddress(`Location (${lat.toFixed(5)}°, ${lng.toFixed(5)}°)`);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Update marker position and reverse geocode
  const setPinLocation = useCallback(
    (
      lat: number,
      lng: number,
      acc?: number,
      fly: boolean = true,
      source: 'search' | 'gps' | 'manual_pin' = 'manual_pin'
    ) => {
      setCurrentCoords({ lat, lng });
      setAccuracy(acc);
      setLocationSource(source);
      setIsConfirmed(false); // Unconfirm upon coordinate change so user reviews new spot

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }

      if (accuracyCircleRef.current) {
        if (acc) {
          accuracyCircleRef.current.setLatLng([lat, lng]);
          accuracyCircleRef.current.setRadius(acc);
          accuracyCircleRef.current.setStyle({ opacity: 1, fillOpacity: 0.15 });
        } else {
          accuracyCircleRef.current.setStyle({ opacity: 0, fillOpacity: 0 });
        }
      }

      if (fly && leafletMapRef.current) {
        leafletMapRef.current.flyTo([lat, lng], Math.max(leafletMapRef.current.getZoom(), 16), {
          duration: 1.0,
        });
      }

      fetchAddress(lat, lng);
    },
    [fetchAddress]
  );

  // Initialize Map
  useEffect(() => {
    if (!mounted || !mapContainerRef.current) return;
    let isCancelled = false;

    async function init() {
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

        if (isCancelled || !mapContainerRef.current || leafletMapRef.current) return;

        const map = L.map(mapContainerRef.current, {
          center: [currentCoords.lat, currentCoords.lng],
          zoom: DEFAULT_MAP_ZOOM,
          zoomControl: false,
        });

        leafletMapRef.current = map;

        // Add Free OpenStreetMap Tile layer
        const layerConfig = TILE_LAYERS[activeLayer] || TILE_LAYERS.osm_standard;
        tileLayerRef.current = L.tileLayer(layerConfig.url, {
          attribution: layerConfig.attribution,
          maxZoom: layerConfig.maxZoom,
        }).addTo(map);

        // Accuracy Circle
        accuracyCircleRef.current = L.circle([currentCoords.lat, currentCoords.lng], {
          radius: accuracy || 0,
          color: '#0284c7',
          fillColor: '#38bdf8',
          fillOpacity: accuracy ? 0.15 : 0,
          weight: 1.5,
          opacity: accuracy ? 1 : 0,
        }).addTo(map);

        // Custom draggable pin icon
        const pinIcon = L.divIcon({
          className: 'civic-draggable-pin',
          html: `
            <div style="
              position: relative;
              transform: translate(-50%, -100%);
              cursor: grab;
            ">
              <div style="
                background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);
                width: 38px;
                height: 38px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <span style="transform: rotate(45deg); font-size: 17px;">📍</span>
              </div>
              <div style="
                position: absolute;
                bottom: -4px;
                left: 50%;
                transform: translateX(-50%);
                width: 12px;
                height: 6px;
                background: rgba(0,0,0,0.3);
                border-radius: 50%;
                filter: blur(1px);
              "></div>
            </div>
          `,
          iconSize: [38, 44],
          iconAnchor: [19, 44],
        });

        const marker = L.marker([currentCoords.lat, currentCoords.lng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        markerRef.current = marker;

        // Listen for drag end
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setPinLocation(pos.lat, pos.lng, undefined, false, 'manual_pin');
        });

        // Listen for map click to re-pin
        map.on('click', (e: any) => {
          setPinLocation(e.latlng.lat, e.latlng.lng, undefined, false, 'manual_pin');
        });

        // If no initial address provided, reverse geocode now
        if (!initialLocation?.address) {
          fetchAddress(currentCoords.lat, currentCoords.lng);
        }
      } catch (err) {
        console.error('Failed to initialize LocationPicker map:', err);
      }
    }

    init();

    return () => {
      isCancelled = true;
    };
  }, [mounted]);

  // Handle Layer Switch
  const toggleLayer = () => {
    if (!leafletMapRef.current || !tileLayerRef.current || !LRef.current) return;
    const nextLayer = activeLayer === 'osm_standard' ? 'carto_positron' : 'osm_standard';
    setActiveLayer(nextLayer);

    leafletMapRef.current.removeLayer(tileLayerRef.current);
    const layerConfig = TILE_LAYERS[nextLayer];
    tileLayerRef.current = LRef.current.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
    }).addTo(leafletMapRef.current);
  };

  // Browser GPS Locate (Method B)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy) || 15;
        setPinLocation(lat, lng, acc, true, 'gps');
      },
      err => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert(
          'Could not retrieve your precise GPS coordinates. You can search your area or click on the map to set your location.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle place selected from search bar (Method A)
  const handleSelectPlace = (place: { lat: number; lng: number; displayName: string; city?: string }) => {
    setPinLocation(place.lat, place.lng, undefined, true, 'search');
    setAddress(place.displayName);
    if (place.city) setCity(place.city);
  };

  // Zoom controls
  const handleZoomIn = () => leafletMapRef.current?.zoomIn();
  const handleZoomOut = () => leafletMapRef.current?.zoomOut();

  // Reset to default center
  const handleResetView = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, { duration: 1.0 });
    }
  };

  // Confirm Location
  const handleConfirm = () => {
    setIsConfirmed(true);
    onLocationConfirm({
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      address,
      city,
      accuracy,
      locationSource,
      isConfirmed: true,
    });
  };

  if (!mounted) {
    return (
      <div className="w-full h-[340px] sm:h-[420px] bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
        <span className="text-xs">Loading OpenStreetMap interactive location selector...</span>
      </div>
    );
  }

  const sourceLabels: Record<'search' | 'gps' | 'manual_pin', { label: string; color: string }> = {
    search: { label: 'Place Search', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
    gps: { label: 'Device GPS', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    manual_pin: { label: 'Manual Pinpoint', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  };

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {/* 3 Selection Methods Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-2">
          <MapSearch
            onSelectLocation={handleSelectPlace}
            placeholder="Search place (e.g. Chandigarh University, Sector 17, Elante Mall)..."
          />
        </div>

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-full px-4 py-2.5 min-h-[44px] bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-teal-300 flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
          ) : (
            <Navigation className="w-4 h-4 text-teal-400" />
          )}
          <span>{isLocating ? 'Detecting GPS...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[340px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

        {/* Map Controls (Floating Top-Right) */}
        <MapControls
          className="absolute top-3 right-3"
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          onToggleLayer={toggleLayer}
          currentLayer={TILE_LAYERS[activeLayer]?.name}
          onResetView={handleResetView}
        />

        {/* Helper Hint Badge (Floating Bottom-Left) */}
        <div className="absolute bottom-3 left-3 right-12 sm:right-auto z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 shadow-md flex items-center space-x-1.5">
          <Crosshair className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="line-clamp-1 sm:line-clamp-none">Click or drag marker to set exact location</span>
        </div>

        {/* Free OSM Attribution Pill */}
        <div className="hidden sm:block absolute bottom-3 right-3 z-20 pointer-events-none bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] text-slate-400 border border-slate-800">
          © OpenStreetMap contributors
        </div>
      </div>

      {/* Selected Coordinates & Confirmation Bar */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-xl">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
            {isReverseGeocoding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Selected Incident Coordinates
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${sourceLabels[locationSource].color}`}
              >
                Source: {sourceLabels[locationSource].label}
              </span>
              {accuracy && (
                <span className="text-[10px] font-mono bg-slate-800 text-teal-300 px-1.5 py-0.2 rounded border border-slate-700">
                  GPS ±{accuracy}m
                </span>
              )}
              {isConfirmed ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 rounded-full flex items-center space-x-1">
                  <Check className="w-2.5 h-2.5" />
                  <span>Confirmed</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.2 rounded-full flex items-center space-x-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>Unconfirmed (Review & Confirm Below)</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-semibold text-white break-words line-clamp-2">
              {address}
            </p>

            <p className="text-[11px] font-mono text-slate-400">
              Latitude: <strong className="text-slate-200">{currentCoords.lat.toFixed(5)}° N</strong>, Longitude:{' '}
              <strong className="text-slate-200">{currentCoords.lng.toFixed(5)}° E</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className={`w-full md:w-auto min-h-[44px] px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shrink-0 shadow-lg ${
            isConfirmed
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-teal-500 to-brand-600 hover:from-teal-400 hover:to-brand-500 text-white shadow-teal-500/20 ring-2 ring-teal-400/30 animate-pulse'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isConfirmed ? 'Location Verified & Confirmed ✓' : 'Confirm Selected Location'}</span>
        </button>
      </div>
    </div>
  );
}
