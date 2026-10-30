import { NextRequest, NextResponse } from 'next/server';
import { findGeocodePlaces } from '@/lib/maps/geocoding-data';

export interface GeocodeSearchResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  category?: string;
  city?: string;
  state?: string;
  source: 'external' | 'verified_index';
}

// In-memory LRU cache for search results to minimize external calls and speed up repetitive typing
const searchCache = new Map<string, { timestamp: number; results: GeocodeSearchResult[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 15) : 8;

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const cacheKey = `${query.toLowerCase()}::${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ results: cached.results });
    }

    let results: GeocodeSearchResult[] = [];

    // 1. Check local verified places first for instant sub-millisecond response
    const localMatches = findGeocodePlaces(query, limit);

    // 2. Try external geocoding if network is available (optional external enrichment)
    const mapTilerKey = process.env.MAPTILER_API_KEY || process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    const locationIqKey = process.env.LOCATIONIQ_API_KEY;

    try {
      if (locationIqKey) {
        const url = `https://us1.locationiq.com/v1/search?key=${locationIqKey}&q=${encodeURIComponent(query)}&format=json&limit=${limit}&countrycodes=in`;
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          results = data.map((item: any) => ({
            id: `liq-${item.place_id}`,
            name: item.display_name.split(',')[0],
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            category: item.type || 'place',
            source: 'external',
          }));
        }
      } else if (mapTilerKey) {
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${mapTilerKey}&limit=${limit}&country=in`;
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          results = (data.features || []).map((feat: any) => ({
            id: `mt-${feat.id}`,
            name: feat.text,
            displayName: feat.place_name,
            lat: feat.center[1],
            lng: feat.center[0],
            category: feat.place_type?.[0] || 'place',
            source: 'external',
          }));
        }
      } else {
        // Fallback to OpenStreetMap Nominatim with standard respectful headers
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}&countrycodes=in`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'CivicPulse-App/1.0 (civicpulse@smartcity.gov.in)',
            'Accept-Language': 'en',
          },
          signal: AbortSignal.timeout(1500),
        });
        if (res.ok) {
          const data = await res.json();
          results = data.map((item: any) => ({
            id: `osm-${item.place_id}`,
            name: item.display_name.split(',')[0],
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            category: item.type || item.class || 'place',
            city: item.address?.city || item.address?.town || item.address?.county,
            state: item.address?.state,
            source: 'external',
          }));
        }
      }
    } catch {
      // Network failure, sandboxed environment, or rate limit: gracefully continue with verified index
    }

    // Merge results, giving local verified places high priority and deduplicating
    const combined: GeocodeSearchResult[] = [];
    const seenNames = new Set<string>();

    for (const local of localMatches) {
      combined.push({
        id: local.id,
        name: local.name,
        displayName: local.displayName,
        lat: local.lat,
        lng: local.lng,
        category: local.category,
        city: local.city,
        state: local.state,
        source: 'verified_index',
      });
      seenNames.add(local.name.toLowerCase());
    }

    for (const ext of results) {
      if (!seenNames.has(ext.name.toLowerCase())) {
        combined.push(ext);
        seenNames.add(ext.name.toLowerCase());
      }
    }

    const finalResults = combined.slice(0, limit);

    // Cache the response
    searchCache.set(cacheKey, { timestamp: Date.now(), results: finalResults });
    if (searchCache.size > 200) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) searchCache.delete(oldestKey);
    }

    return NextResponse.json({ results: finalResults });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Geocoding search failed', details: error.message, results: [] },
      { status: 500 }
    );
  }
}
