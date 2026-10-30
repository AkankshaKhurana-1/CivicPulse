import { GeocodeSearchResult } from '@/app/api/geocode/search/route';
import { ReverseGeocodeResult } from '@/app/api/geocode/reverse/route';

export type { GeocodeSearchResult, ReverseGeocodeResult };

/**
 * Searches for places via the CivicPulse Geocoding API
 */
export async function searchLocations(
  query: string,
  options: { signal?: AbortSignal; limit?: number } = {}
): Promise<GeocodeSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  try {
    const limit = options.limit || 8;
    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`, {
      signal: options.signal,
    });

    if (!res.ok) {
      throw new Error(`Search request failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.results || [];
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return [];
    }
    console.warn('Geocoding search error:', err);
    return [];
  }
}

/**
 * Reverse geocodes coordinates to a readable street/area address
 */
export async function reverseGeocodeLocation(
  lat: number,
  lng: number,
  options: { signal?: AbortSignal } = {}
): Promise<ReverseGeocodeResult | null> {
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
      signal: options.signal,
    });

    if (!res.ok) {
      return null;
    }

    const data: ReverseGeocodeResult = await res.json();
    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null;
    }
    console.warn('Reverse geocoding error:', err);
    return null;
  }
}
