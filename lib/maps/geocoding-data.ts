export interface GeocodePlace {
  id: string;
  name: string;
  displayName: string;
  category: 'university' | 'hospital' | 'commercial' | 'landmark' | 'sector' | 'city' | 'transit' | 'suburb' | 'government';
  lat: number;
  lng: number;
  city: string;
  state: string;
  pincode?: string;
  boundingBox?: [number, number, number, number]; // [southLat, northLat, westLng, eastLng]
  keywords: string[];
}

export const VERIFIED_INDIAN_PLACES: GeocodePlace[] = [
  // --- CHANDIGARH UNIVERSITY & ADJACENT ---
  {
    id: 'cu-gharuani',
    name: 'Chandigarh University',
    displayName: 'Chandigarh University, NH-95, Gharuan, Mohali, Punjab 140413',
    category: 'university',
    lat: 30.7700,
    lng: 76.5764,
    city: 'Mohali',
    state: 'Punjab',
    pincode: '140413',
    keywords: ['chandigarh university', 'cu', 'gharuan', 'cu campus', 'chandigarh univ', 'nh-95'],
  },
  {
    id: 'panjab-univ',
    name: 'Panjab University',
    displayName: 'Panjab University (PU), Sector 14, Chandigarh 160014',
    category: 'university',
    lat: 30.7600,
    lng: 76.7680,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160014',
    keywords: ['panjab university', 'pu', 'sector 14', 'pu chandigarh', 'student centre pu'],
  },
  {
    id: 'elante-mall',
    name: 'Elante Mall, Chandigarh',
    displayName: 'Elante Mall, Industrial Area Phase I, Chandigarh 160002',
    category: 'commercial',
    lat: 30.7055,
    lng: 76.8013,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160002',
    keywords: ['elante mall', 'elante mall, chandigarh', 'elante', 'nexus elante', 'industrial area phase 1', 'chandigarh mall'],
  },
  {
    id: 'sector-17-chd',
    name: 'Sector 17, Chandigarh',
    displayName: 'Sector 17 (City Centre), Chandigarh 160017',
    category: 'commercial',
    lat: 30.7415,
    lng: 76.7794,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160017',
    keywords: ['sector 17', 'sector 17, chandigarh', 'sector 17 chandigarh', 'city centre sector 17', 'plaza 17', 'sec 17'],
  },
  {
    id: 'pgimer-chd',
    name: 'PGIMER Chandigarh',
    displayName: 'Postgraduate Institute of Medical Education and Research (PGIMER), Sector 12, Chandigarh 160012',
    category: 'hospital',
    lat: 30.7645,
    lng: 76.7790,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160012',
    keywords: ['pgimer', 'pgi', 'pgi chandigarh', 'sector 12', 'pgimer hospital', 'nehru hospital'],
  },
  {
    id: 'gmc-sector-32',
    name: 'GMCH Sector 32',
    displayName: 'Government Medical College and Hospital (GMCH), Sector 32, Chandigarh 160030',
    category: 'hospital',
    lat: 30.7093,
    lng: 76.7667,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160030',
    keywords: ['gmch', 'gmch 32', 'sector 32 hospital', 'chandigarh hospital'],
  },
  {
    id: 'sukhna-lake',
    name: 'Sukhna Lake, Chandigarh',
    displayName: 'Sukhna Lake, Sector 1, Chandigarh 160001',
    category: 'landmark',
    lat: 30.7421,
    lng: 76.8188,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160001',
    keywords: ['sukhna lake', 'sukhna', 'sector 1', 'lake club'],
  },
  {
    id: 'rock-garden',
    name: 'Rock Garden of Chandigarh',
    displayName: 'Nek Chand Rock Garden, Sector 1, Chandigarh 160001',
    category: 'landmark',
    lat: 30.7525,
    lng: 76.8101,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160001',
    keywords: ['rock garden', 'nek chand rock garden', 'sector 1'],
  },
  {
    id: 'rose-garden',
    name: 'Zakir Hussain Rose Garden',
    displayName: 'Zakir Hussain Rose Garden, Sector 16, Chandigarh 160016',
    category: 'landmark',
    lat: 30.7468,
    lng: 76.7820,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160016',
    keywords: ['rose garden', 'zakir hussain rose garden', 'sector 16'],
  },
  {
    id: 'sector-35-chd',
    name: 'Sector 35, Chandigarh',
    displayName: 'Sector 35 Market, Chandigarh 160035',
    category: 'commercial',
    lat: 30.7225,
    lng: 76.7681,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160035',
    keywords: ['sector 35', 'sector 35 market', 'sec 35', 'aroma hotel sector 22/35'],
  },
  {
    id: 'sector-22-chd',
    name: 'Sector 22, Chandigarh',
    displayName: 'Sector 22 Shastri Market, Chandigarh 160022',
    category: 'commercial',
    lat: 30.7302,
    lng: 76.7725,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160022',
    keywords: ['sector 22', 'sec 22', 'shastri market sector 22', 'kiran cinema'],
  },
  {
    id: 'sector-43-isbt',
    name: 'ISBT Sector 43, Chandigarh',
    displayName: 'Inter-State Bus Terminus (ISBT 43), Sector 43, Chandigarh 160043',
    category: 'transit',
    lat: 30.7188,
    lng: 76.7417,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160043',
    keywords: ['isbt 43', 'isbt sector 43', 'bus stand sector 43', 'sector 43'],
  },
  {
    id: 'chandigarh-railway-station',
    name: 'Chandigarh Junction Railway Station',
    displayName: 'Chandigarh Junction Railway Station, Daria, Chandigarh 160102',
    category: 'transit',
    lat: 30.7022,
    lng: 76.8228,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160102',
    keywords: ['chandigarh railway station', 'railway station chandigarh', 'railway station, chandigarh', 'chandigarh junction', 'cdg station'],
  },
  {
    id: 'chandigarh-city',
    name: 'Chandigarh',
    displayName: 'Chandigarh City Centre, Union Territory, India',
    category: 'city',
    lat: 30.7333,
    lng: 76.7794,
    city: 'Chandigarh',
    state: 'Chandigarh',
    pincode: '160017',
    keywords: ['chandigarh', 'the city beautiful', 'chd'],
  },

  // --- MOHALI / SAS NAGAR ---
  {
    id: 'mohali-city',
    name: 'Mohali, Punjab',
    displayName: 'SAS Nagar (Mohali), Punjab 160055',
    category: 'city',
    lat: 30.7046,
    lng: 76.7179,
    city: 'Mohali',
    state: 'Punjab',
    pincode: '160055',
    keywords: ['mohali', 'sas nagar', 'mohali punjab', 'sahibzada ajit singh nagar'],
  },
  {
    id: 'pca-stadium-mohali',
    name: 'PCA Stadium, Mohali',
    displayName: 'IS Bindra Punjab Cricket Association Stadium, Phase 9, Mohali, Punjab 160062',
    category: 'landmark',
    lat: 30.6908,
    lng: 76.7374,
    city: 'Mohali',
    state: 'Punjab',
    pincode: '160062',
    keywords: ['pca stadium', 'mohali stadium', 'cricket stadium mohali', 'phase 9 mohali'],
  },
  {
    id: 'mohali-phase-7',
    name: 'Phase 7, Mohali',
    displayName: 'Phase 7 Market, Sector 61, Mohali, Punjab 160062',
    category: 'commercial',
    lat: 30.7100,
    lng: 76.7220,
    city: 'Mohali',
    state: 'Punjab',
    pincode: '160062',
    keywords: ['phase 7 mohali', 'phase 7', 'sec 61 mohali', 'sector 61'],
  },
  {
    id: 'mohali-phase-3b2',
    name: 'Phase 3B2, Mohali',
    displayName: 'Phase 3B2 Market, Sector 60, Mohali, Punjab 160059',
    category: 'commercial',
    lat: 30.7180,
    lng: 76.7265,
    city: 'Mohali',
    state: 'Punjab',
    pincode: '160059',
    keywords: ['phase 3b2', 'phase 3b2 mohali', 'sector 60', '3b2 food street'],
  },
  {
    id: 'mohali-sector-82',
    name: 'Sector 82 JLPL Mohali',
    displayName: 'JLPL Industrial Area, Sector 82, Mohali, Punjab 140308',
    category: 'commercial',
    lat: 30.6667,
    lng: 76.7258,
    city: 'Mohali',
    state: 'Punjab',
    pincode: '140308',
    keywords: ['sector 82', 'jlpl sector 82', 'sector 82 mohali'],
  },
  {
    id: 'max-hospital-mohali',
    name: 'Max Super Speciality Hospital, Mohali',
    displayName: 'Max Hospital, Near Civil Hospital, Phase 6, Mohali, Punjab 160055',
    category: 'hospital',
    lat: 30.7289,
    lng: 76.7118,
    city: 'Mohali',
    state: 'Punjab',
    pincode: '160055',
    keywords: ['max hospital mohali', 'max hospital', 'phase 6 mohali'],
  },
  {
    id: 'fortis-hospital-mohali',
    name: 'Fortis Hospital, Mohali',
    displayName: 'Fortis Hospital, Sector 62, Phase VIII, Mohali, Punjab 160062',
    category: 'hospital',
    lat: 30.6974,
    lng: 76.7328,
    city: 'Mohali',
    state: 'Punjab',
    pincode: '160062',
    keywords: ['fortis hospital mohali', 'fortis mohali', 'sector 62'],
  },

  // --- PANCHKULA ---
  {
    id: 'panchkula-city',
    name: 'Panchkula, Haryana',
    displayName: 'Panchkula City Centre, Sector 5, Panchkula, Haryana 134109',
    category: 'city',
    lat: 30.6942,
    lng: 76.8606,
    city: 'Panchkula',
    state: 'Haryana',
    pincode: '134109',
    keywords: ['panchkula', 'sector 5 panchkula', 'panchkula haryana'],
  },
  {
    id: 'mansa-devi-temple',
    name: 'Mata Mansa Devi Temple, Panchkula',
    displayName: 'Mata Mansa Devi Shrine, Panchkula, Haryana 134114',
    category: 'landmark',
    lat: 30.7305,
    lng: 76.8525,
    city: 'Panchkula',
    state: 'Haryana',
    pincode: '134114',
    keywords: ['mansa devi', 'mansa devi temple', 'panchkula shrine'],
  },

  // --- NEW DELHI & NCR ---
  {
    id: 'india-gate',
    name: 'India Gate, New Delhi',
    displayName: 'India Gate, Rajpath, India Gate, New Delhi, Delhi 110001',
    category: 'landmark',
    lat: 28.6129,
    lng: 77.2295,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    keywords: ['india gate', 'india gate new delhi', 'india gate delhi', 'india gate, delhi', 'kartavya path', 'rajpath', 'c-hexagon'],
  },
  {
    id: 'connaught-place',
    name: 'Connaught Place, Delhi',
    displayName: 'Connaught Place (CP / Rajiv Chowk), Central Delhi, New Delhi 110001',
    category: 'commercial',
    lat: 28.6315,
    lng: 77.2167,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    keywords: ['connaught place', 'cp', 'rajiv chowk', 'connaught place delhi', 'cp inner circle'],
  },
  {
    id: 'aiims-delhi',
    name: 'AIIMS New Delhi',
    displayName: 'All India Institute of Medical Sciences (AIIMS), Ansari Nagar, New Delhi 110029',
    category: 'hospital',
    lat: 28.5672,
    lng: 77.2100,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110029',
    keywords: ['aiims', 'aiims delhi', 'aiims new delhi', 'ansari nagar', 'safdarjung'],
  },
  {
    id: 'delhi-university-north',
    name: 'Delhi University (North Campus)',
    displayName: 'University of Delhi, North Campus, University Enclave, Delhi 110007',
    category: 'university',
    lat: 28.6896,
    lng: 77.2078,
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110007',
    keywords: ['delhi university', 'du', 'north campus', 'du north campus', 'arts faculty du'],
  },
  {
    id: 'delhi-university-south',
    name: 'Delhi University (South Campus)',
    displayName: 'University of Delhi, South Campus, Benito Juarez Marg, Dhaula Kuan, New Delhi 110021',
    category: 'university',
    lat: 28.5843,
    lng: 77.1638,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110021',
    keywords: ['du south campus', 'south campus', 'dhaula kuan'],
  },
  {
    id: 'iit-delhi',
    name: 'IIT Delhi',
    displayName: 'Indian Institute of Technology Delhi, Hauz Khas, New Delhi 110016',
    category: 'university',
    lat: 28.5450,
    lng: 77.1926,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110016',
    keywords: ['iit delhi', 'iitd', 'hauz khas', 'iit campus'],
  },
  {
    id: 'hauz-khas-village',
    name: 'Hauz Khas Village, Delhi',
    displayName: 'Hauz Khas Village, Deer Park, South Delhi, New Delhi 110016',
    category: 'commercial',
    lat: 28.5534,
    lng: 77.1947,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110016',
    keywords: ['hauz khas', 'hkv', 'hauz khas village', 'deer park'],
  },
  {
    id: 'lajpat-nagar-market',
    name: 'Lajpat Nagar Central Market',
    displayName: 'Central Market, Lajpat Nagar II, South Delhi, New Delhi 110024',
    category: 'commercial',
    lat: 28.5677,
    lng: 77.2433,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110024',
    keywords: ['lajpat nagar', 'central market lajpat nagar', 'lajpat nagar 2'],
  },
  {
    id: 'karol-bagh-market',
    name: 'Karol Bagh Market',
    displayName: 'Karol Bagh Market, Ghaffar Market, Central Delhi, New Delhi 110005',
    category: 'commercial',
    lat: 28.6517,
    lng: 77.1906,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110005',
    keywords: ['karol bagh', 'ghaffar market', 'ajmal khan road'],
  },
  {
    id: 'new-delhi-railway-station',
    name: 'New Delhi Railway Station',
    displayName: 'New Delhi Railway Station (NDLS), Paharganj/Ajmeri Gate, New Delhi 110002',
    category: 'transit',
    lat: 28.6429,
    lng: 77.2195,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110002',
    keywords: ['new delhi railway station', 'ndls', 'paharganj station', 'ajmeri gate'],
  },
  {
    id: 'delhi-airport-t3',
    name: 'Indira Gandhi International Airport (IGI T3)',
    displayName: 'Indira Gandhi International Airport, Terminal 3, New Delhi 110037',
    category: 'transit',
    lat: 28.5562,
    lng: 77.1000,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110037',
    keywords: ['delhi airport', 'igi airport', 'terminal 3', 'igi t3'],
  },
  {
    id: 'delhi-city',
    name: 'Delhi',
    displayName: 'Delhi National Capital Territory, India',
    category: 'city',
    lat: 28.6139,
    lng: 77.2090,
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    keywords: ['delhi', 'new delhi', 'nct of delhi'],
  },

  // --- LUDHIANA, PUNJAB ---
  {
    id: 'ludhiana-city',
    name: 'Ludhiana, Punjab',
    displayName: 'Ludhiana City Centre, Clock Tower, Ludhiana, Punjab 141008',
    category: 'city',
    lat: 30.9010,
    lng: 75.8573,
    city: 'Ludhiana',
    state: 'Punjab',
    pincode: '141008',
    keywords: ['ludhiana', 'ludhiana punjab', 'clock tower ludhiana'],
  },
  {
    id: 'pau-ludhiana',
    name: 'Punjab Agricultural University (PAU)',
    displayName: 'Punjab Agricultural University, Ferozepur Road, Ludhiana, Punjab 141027',
    category: 'university',
    lat: 30.9015,
    lng: 75.8080,
    city: 'Ludhiana',
    state: 'Punjab',
    pincode: '141027',
    keywords: ['pau', 'pau ludhiana', 'punjab agricultural university', 'ferozepur road'],
  },
  {
    id: 'dmc-hospital-ludhiana',
    name: 'Dayanand Medical College (DMC) Hospital',
    displayName: 'DMC Hospital, Civil Lines, Tagore Nagar, Ludhiana, Punjab 141001',
    category: 'hospital',
    lat: 30.9130,
    lng: 75.8340,
    city: 'Ludhiana',
    state: 'Punjab',
    pincode: '141001',
    keywords: ['dmc hospital', 'dmch', 'dayanand medical college', 'civil lines ludhiana'],
  },
  {
    id: 'sarabha-nagar-market',
    name: 'Sarabha Nagar Market (Kipps Market), Ludhiana',
    displayName: 'Kipps Market, Sarabha Nagar, Ludhiana, Punjab 141001',
    category: 'commercial',
    lat: 30.8870,
    lng: 75.8160,
    city: 'Ludhiana',
    state: 'Punjab',
    pincode: '141001',
    keywords: ['sarabha nagar', 'kipps market', 'sarabha nagar market', 'ludhiana main market'],
  },
  {
    id: 'model-town-ludhiana',
    name: 'Model Town, Ludhiana',
    displayName: 'Model Town Market, Ludhiana, Punjab 141002',
    category: 'commercial',
    lat: 30.8920,
    lng: 75.8390,
    city: 'Ludhiana',
    state: 'Punjab',
    pincode: '141002',
    keywords: ['model town ludhiana', 'model town', 'gol market model town'],
  },
];

/**
 * Normalizes text for matching by removing special characters and lowering case
 */
function normalizeQuery(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Searches the verified places database with weighted keyword scoring
 */
export function findGeocodePlaces(query: string, limit = 8): GeocodePlace[] {
  const norm = normalizeQuery(query);
  if (!norm || norm.length < 2) return [];

  const queryTerms = norm.split(' ').filter(Boolean);

  const scored: Array<{ place: GeocodePlace; score: number }> = [];

  for (const place of VERIFIED_INDIAN_PLACES) {
    let score = 0;
    const nameNorm = normalizeQuery(place.name);
    const displayNorm = normalizeQuery(place.displayName);
    const keywordsNorm = place.keywords.map(normalizeQuery);

    // Exact matches
    if (nameNorm === norm) {
      score += 250;
    } else if (nameNorm.startsWith(norm)) {
      score += 70;
    } else if (nameNorm.includes(norm)) {
      score += 50;
    }

    // Keyword exact matches
    for (const kw of keywordsNorm) {
      if (kw === norm) {
        score += 90;
      } else if (kw.startsWith(norm)) {
        score += 60;
      } else if (kw.includes(norm)) {
        score += 40;
      }
    }

    // Term-by-term match
    let matchedTerms = 0;
    for (const term of queryTerms) {
      const inName = nameNorm.includes(term);
      const inDisplay = displayNorm.includes(term);
      const inKw = keywordsNorm.some(k => k.includes(term));

      if (inName) {
        matchedTerms++;
        score += 20;
      } else if (inKw) {
        matchedTerms++;
        score += 15;
      } else if (inDisplay) {
        matchedTerms++;
        score += 10;
      }
    }

    // Bonus for matching all terms
    if (matchedTerms === queryTerms.length && queryTerms.length > 1) {
      score += 30;
    }

    if (score > 0) {
      scored.push({ place, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.place);
}

/**
 * Finds the nearest place given a latitude and longitude
 */
export function findNearestPlace(lat: number, lng: number): GeocodePlace | null {
  let closest: GeocodePlace | null = null;
  let minDistance = Infinity;

  for (const place of VERIFIED_INDIAN_PLACES) {
    const dLat = place.lat - lat;
    const dLng = place.lng - lng;
    // Euclidean approximation for small distances
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = place;
    }
  }

  return closest;
}
