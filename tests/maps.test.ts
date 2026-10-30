import { describe, it, expect } from 'vitest';
import { findGeocodePlaces, findNearestPlace, VERIFIED_INDIAN_PLACES } from '../lib/maps/geocoding-data';
import {
  MAP_CITIES,
  TILE_LAYERS,
  CATEGORY_MAP_VISUALS,
  PRIORITY_COLORS,
  STATUS_BORDER_COLORS,
} from '../lib/maps/map-config';

describe('Geocoding & Place Search Engine', () => {
  it('searches for Chandigarh University accurately', () => {
    const results = findGeocodePlaces('Chandigarh University');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first.name).toBe('Chandigarh University');
    expect(first.lat).toBeCloseTo(30.7700, 3);
    expect(first.lng).toBeCloseTo(76.5764, 3);
    expect(first.city).toBe('Mohali');
  });

  it('searches for Panjab University accurately', () => {
    const results = findGeocodePlaces('Panjab University');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first.name).toBe('Panjab University');
    expect(first.lat).toBeCloseTo(30.7600, 3);
    expect(first.lng).toBeCloseTo(76.7680, 3);
  });

  it('searches for Elante Mall Chandigarh accurately', () => {
    const results = findGeocodePlaces('Elante Mall');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first.name).toContain('Elante');
    expect(first.lat).toBeCloseTo(30.7055, 3);
    expect(first.lng).toBeCloseTo(76.8013, 3);
  });

  it('searches for Sector 17 Chandigarh accurately', () => {
    const results = findGeocodePlaces('Sector 17, Chandigarh');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first.name).toContain('Sector 17');
    expect(first.lat).toBeCloseTo(30.7415, 3);
    expect(first.lng).toBeCloseTo(76.7794, 3);
  });

  it('searches for PGIMER Chandigarh accurately', () => {
    const results = findGeocodePlaces('PGIMER Chandigarh');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first.name).toContain('PGIMER');
    expect(first.category).toBe('hospital');
    expect(first.lat).toBeCloseTo(30.7645, 3);
  });

  it('searches for India Gate, New Delhi accurately', () => {
    const results = findGeocodePlaces('India Gate');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first.name).toContain('India Gate');
    expect(first.lat).toBeCloseTo(28.6129, 3);
    expect(first.lng).toBeCloseTo(77.2295, 3);
  });

  it('searches for Connaught Place, Delhi accurately', () => {
    const results = findGeocodePlaces('Connaught Place');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first.name).toContain('Connaught Place');
    expect(first.lat).toBeCloseTo(28.6315, 3);
    expect(first.lng).toBeCloseTo(77.2167, 3);
  });

  it('searches for Mohali, Punjab accurately', () => {
    const results = findGeocodePlaces('Mohali');
    expect(results.length).toBeGreaterThan(0);
    const match = results.find(r => r.city === 'Mohali');
    expect(match).toBeDefined();
    expect(match?.lat).toBeCloseTo(30.7046, 1);
  });

  it('searches for Chandigarh and Ludhiana accurately', () => {
    const chdResults = findGeocodePlaces('Chandigarh');
    expect(chdResults.length).toBeGreaterThan(0);
    expect(chdResults[0].name).toBe('Chandigarh');

    const ldhResults = findGeocodePlaces('Ludhiana');
    expect(ldhResults.length).toBeGreaterThan(0);
    expect(ldhResults[0].name).toContain('Ludhiana');
  });

  it('supports acronym and informal search terms (CU, PU, CP, PGI)', () => {
    const cu = findGeocodePlaces('CU');
    expect(cu.some(r => r.name === 'Chandigarh University')).toBe(true);

    const pu = findGeocodePlaces('PU');
    expect(pu.some(r => r.name === 'Panjab University')).toBe(true);

    const cp = findGeocodePlaces('CP');
    expect(cp.some(r => r.name.includes('Connaught Place'))).toBe(true);

    const pgi = findGeocodePlaces('PGI');
    expect(pgi.some(r => r.name.includes('PGIMER'))).toBe(true);
  });

  it('performs reverse geocoding to find nearest verified landmark', () => {
    // Exact or very close to India Gate
    const nearest1 = findNearestPlace(28.6130, 77.2296);
    expect(nearest1?.name).toContain('India Gate');

    // Near Chandigarh University
    const nearest2 = findNearestPlace(30.7701, 76.5765);
    expect(nearest2?.name).toBe('Chandigarh University');
  });

  it('searches for Railway Station Chandigarh accurately', () => {
    const results = findGeocodePlaces('Railway Station, Chandigarh');
    expect(results.length).toBeGreaterThan(0);
    const match = results.find(r => r.name.toLowerCase().includes('railway station'));
    expect(match).toBeDefined();
    expect(match?.name).toContain('Railway Station');
    expect(match?.lat).toBeCloseTo(30.7022, 3);
    expect(match?.lng).toBeCloseTo(76.8228, 3);
  });

  it('searches for all 5 primary benchmark locations accurately', () => {
    const benchmarks = [
      { query: 'Chandigarh University', expectedName: 'Chandigarh University', lat: 30.7700, lng: 76.5764 },
      { query: 'Sector 17, Chandigarh', expectedName: 'Sector 17', lat: 30.7415, lng: 76.7794 },
      { query: 'Elante Mall, Chandigarh', expectedName: 'Elante Mall', lat: 30.7055, lng: 76.8013 },
      { query: 'India Gate, Delhi', expectedName: 'India Gate', lat: 28.6129, lng: 77.2295 },
      { query: 'Railway Station, Chandigarh', expectedName: 'Railway Station', lat: 30.7022, lng: 76.8228 },
    ];

    for (const b of benchmarks) {
      const results = findGeocodePlaces(b.query);
      expect(results.length, `Expected results for query: ${b.query}`).toBeGreaterThan(0);
      const topMatch = results[0];
      expect(topMatch.name).toContain(b.expectedName);
      expect(topMatch.lat).toBeCloseTo(b.lat, 2);
      expect(topMatch.lng).toBeCloseTo(b.lng, 2);
    }
  });
});

describe('OpenStreetMap Navigation & Popup Generation (Zero Proprietary Dependencies)', () => {
  it('generates valid OpenStreetMap OSRM routing URLs without Google Maps or paid APIs', async () => {
    const { getOpenStreetMapDirectionsUrl } = await import('../components/map/MapConfig');
    const url = getOpenStreetMapDirectionsUrl(30.7333, 76.7794);
    expect(url).toContain('https://www.openstreetmap.org/directions');
    expect(url).toContain('engine=fossgis_osrm_car');
    expect(url).toContain('route=;30.7333%2C76.7794');
    expect(url).not.toContain('google.com');
    expect(url).not.toContain('mapbox.com');
  });

  it('generates incident popup HTML with OSM navigation and no proprietary links', async () => {
    const { createIncidentPopupHtml } = await import('../components/map/IncidentMarker');
    const dummyIncident: any = {
      id: 'inc-test-123',
      title: 'Pothole on Madhya Marg',
      category: 'pothole',
      priority_level: 'HIGH',
      priority_score: 82,
      status: 'IN_PROGRESS',
      lat: 30.7333,
      lng: 76.7794,
      address: 'Sector 17, Chandigarh',
      report_count: 5,
    };

    const html = createIncidentPopupHtml(dummyIncident);
    expect(html).toContain('Pothole on Madhya Marg');
    expect(html).toContain('Sector 17, Chandigarh');
    expect(html).toContain('/issues/inc-test-123');
    expect(html).toContain('https://www.openstreetmap.org/directions');
    expect(html).not.toContain('google.com');
    expect(html).not.toContain('mapbox.com');
  });

  it('generates infrastructure asset popup HTML with OSM navigation and Failure DNA details', async () => {
    const { createInfrastructureAssetPopupHtml } = await import('../components/map/IncidentMarker');
    const dummyAsset: any = {
      id: 'asset-test-456',
      name: 'Madhya Marg Storm Drain Culvert',
      asset_code: 'DR-CHD-17-01',
      category: 'blocked_drain',
      is_chronic_failure: true,
      failure_count: 4,
      repair_count: 3,
      recurrence_count: 3,
      lat: 30.7415,
      lng: 76.7794,
    };

    const html = createInfrastructureAssetPopupHtml(dummyAsset);
    expect(html).toContain('Madhya Marg Storm Drain Culvert');
    expect(html).toContain('DR-CHD-17-01');
    expect(html).toContain('CHRONIC ZONE');
    expect(html).toContain('4 breakdowns');
    expect(html).toContain('/infrastructure/asset-test-456');
    expect(html).toContain('https://www.openstreetmap.org/directions');
    expect(html).not.toContain('google.com');
    expect(html).not.toContain('mapbox.com');
  });
});

describe('Map Visuals & Configuration Integrity', () => {
  it('defines valid city centers for Delhi, Chandigarh, and Ludhiana', () => {
    expect(MAP_CITIES['city-delhi']).toBeDefined();
    expect(MAP_CITIES['city-chandigarh']).toBeDefined();
    expect(MAP_CITIES['city-ludhiana']).toBeDefined();

    expect(MAP_CITIES['city-delhi'].center[0]).toBeGreaterThan(28);
    expect(MAP_CITIES['city-chandigarh'].center[0]).toBeGreaterThan(30);
    expect(MAP_CITIES['city-ludhiana'].center[0]).toBeGreaterThan(30);
  });

  it('configures standard tile layers CartoDB and OSM with OpenStreetMap attribution', () => {
    expect(TILE_LAYERS.carto_positron).toBeDefined();
    expect(TILE_LAYERS.carto_positron.url).toContain('cartocdn.com');
    expect(TILE_LAYERS.osm_standard).toBeDefined();
    expect(TILE_LAYERS.osm_standard.url).toContain('openstreetmap.org');
    expect(TILE_LAYERS.osm_standard.attribution).toContain('OpenStreetMap');
  });

  it('provides category visual styles with emojis and valid hex colors for all issue categories', () => {
    const categories = [
      'pothole',
      'waterlogging',
      'blocked_drain',
      'plastic_litter',
      'overflowing_waste',
      'broken_streetlight',
      'damaged_footpath',
      'accessibility_barrier',
      'damaged_road',
      'missed_waste_collection',
      'other',
    ];

    for (const cat of categories) {
      const visual = (CATEGORY_MAP_VISUALS as any)[cat];
      expect(visual, `Missing visual for category ${cat}`).toBeDefined();
      expect(visual.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(visual.emoji.length).toBeGreaterThan(0);
      expect(visual.label.length).toBeGreaterThan(0);
    }
  });

  it('provides priority colors matching CivicPulse specifications', () => {
    expect(PRIORITY_COLORS.CRITICAL).toBe('#EF4444');
    expect(PRIORITY_COLORS.HIGH).toBe('#F97316');
    expect(PRIORITY_COLORS.MEDIUM).toBe('#F59E0B');
    expect(PRIORITY_COLORS.LOW).toBe('#3B82F6');
  });

  it('provides status border colors for all lifecycle states', () => {
    expect(STATUS_BORDER_COLORS.SUBMITTED).toBeDefined();
    expect(STATUS_BORDER_COLORS.UNDER_TRIAGE).toBeDefined();
    expect(STATUS_BORDER_COLORS.ASSIGNED).toBeDefined();
    expect(STATUS_BORDER_COLORS.IN_PROGRESS).toBeDefined();
    expect(STATUS_BORDER_COLORS.COMPLETED_PENDING_VERIFICATION).toBeDefined();
    expect(STATUS_BORDER_COLORS.VERIFIED_CLOSED).toBeDefined();
    expect(STATUS_BORDER_COLORS.REOPENED).toBeDefined();
    expect(STATUS_BORDER_COLORS.REJECTED).toBeDefined();
  });
});
