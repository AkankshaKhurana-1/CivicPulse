import { NextRequest, NextResponse } from 'next/server';
import { findNearestPlace } from '@/lib/maps/geocoding-data';

export interface ReverseGeocodeResult {
  displayName: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat: number;
  lng: number;
  source: 'external' | 'nearest_index' | 'coordinates';
}

const reverseCache = new Map<string, { timestamp: number; result: ReverseGeocodeResult }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    if (!latParam || !lngParam) {
      return NextResponse.json({ error: 'lat and lng parameters are required' }, { status: 400 });
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // Round coordinates to 5 decimal places for caching (~1 meter precision)
    const roundedKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    const cached = reverseCache.get(roundedKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.result);
    }

    let result: ReverseGeocodeResult | null = null;

    // Try external reverse geocoding if network/keys allow
    const locationIqKey = process.env.LOCATIONIQ_API_KEY;
    const mapTilerKey = process.env.MAPTILER_API_KEY || process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

    try {
      if (locationIqKey) {
        const url = `https://us1.locationiq.com/v1/reverse?key=${locationIqKey}&lat=${lat}&lon=${lng}&format=json`;
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          result = {
            displayName: data.display_name,
            road: data.address?.road,
            suburb: data.address?.suburb || data.address?.neighbourhood,
            city: data.address?.city || data.address?.town,
            state: data.address?.state,
            pincode: data.address?.postcode,
            lat,
            lng,
            source: 'external',
          };
        }
      } else if (mapTilerKey) {
        const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${mapTilerKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          const feat = data.features?.[0];
          if (feat) {
            result = {
              displayName: feat.place_name,
              lat,
              lng,
              source: 'external',
            };
          }
        }
      } else {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'CivicPulse-App/1.0 (civicpulse@smartcity.gov.in)',
            'Accept-Language': 'en',
          },
          signal: AbortSignal.timeout(1500),
        });
        if (res.ok) {
          const data = await res.json();
          result = {
            displayName: data.display_name,
            road: data.address?.road,
            suburb: data.address?.suburb || data.address?.neighbourhood,
            city: data.address?.city || data.address?.town || data.address?.county,
            state: data.address?.state,
            pincode: data.address?.postcode,
            lat,
            lng,
            source: 'external',
          };
        }
      }
    } catch {
      // Sandboxed or offline
    }

    // Fallback to nearest verified landmark
    if (!result) {
      const nearest = findNearestPlace(lat, lng);
      if (nearest) {
        const distKm = getDistanceFromLatLonInKm(lat, lng, nearest.lat, nearest.lng);
        if (distKm < 0.1) {
          result = {
            displayName: nearest.displayName,
            city: nearest.city,
            state: nearest.state,
            pincode: nearest.pincode,
            lat,
            lng,
            source: 'nearest_index',
          };
        } else if (distKm < 5.0) {
          result = {
            displayName: `Near ${nearest.name}, ${nearest.city}, ${nearest.state} (~${distKm.toFixed(1)} km)`,
            city: nearest.city,
            state: nearest.state,
            pincode: nearest.pincode,
            lat,
            lng,
            source: 'nearest_index',
          };
        }
      }
    }

    // Final fallback: nicely formatted coordinates
    if (!result) {
      result = {
        displayName: `Location at ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`,
        lat,
        lng,
        source: 'coordinates',
      };
    }

    reverseCache.set(roundedKey, { timestamp: Date.now(), result });
    if (reverseCache.size > 200) {
      const oldestKey = reverseCache.keys().next().value;
      if (oldestKey) reverseCache.delete(oldestKey);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Reverse geocoding failed', details: error.message },
      { status: 500 }
    );
  }
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
