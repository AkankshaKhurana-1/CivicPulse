import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_PRIORITY_CONFIG } from '../lib/engines/priority';

// Helper to load .env.local without external dotenv dependency
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length > 0) {
            process.env[key.trim()] = values.join('=').trim().replace(/^['"]|['"]$/g, '');
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Please configure your credentials in .env.local before running the seed script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// =========================================================================
// STABLE REFERENCE DATA (DETERMINISTIC UUIDS & UNIQUE BUSINESS KEYS)
// =========================================================================

const STABLE_CITIES = [
  {
    id: '00000000-0000-0000-0001-000000000001',
    name: 'New Delhi',
    state: 'Delhi NCR',
    country: 'India',
    lat: 28.6139,
    lng: 77.2090,
    active: true,
  },
  {
    id: '00000000-0000-0000-0001-000000000002',
    name: 'Ludhiana',
    state: 'Punjab',
    country: 'India',
    lat: 30.9010,
    lng: 75.8573,
    active: true,
  },
];

const STABLE_JURISDICTIONS = [
  {
    id: '00000000-0000-0000-0002-000000000001',
    city_id: '00000000-0000-0000-0001-000000000001',
    name: 'Central Zone (Connaught Place & ITO)',
    code: 'DEL-CZ',
    type: 'ZONE',
  },
  {
    id: '00000000-0000-0000-0002-000000000002',
    city_id: '00000000-0000-0000-0001-000000000001',
    name: 'South Zone (Lajpat Nagar & Malviya Nagar)',
    code: 'DEL-SZ',
    type: 'ZONE',
  },
  {
    id: '00000000-0000-0000-0002-000000000003',
    city_id: '00000000-0000-0000-0001-000000000001',
    name: 'West Zone (Janakpuri & Rajouri Garden)',
    code: 'DEL-WZ',
    type: 'ZONE',
  },
  {
    id: '00000000-0000-0000-0002-000000000004',
    city_id: '00000000-0000-0000-0001-000000000002',
    name: 'Civil Lines & Model Town Ward 12',
    code: 'LDH-WZ',
    type: 'WARD',
  },
];

const STABLE_AGENCIES = [
  {
    id: '00000000-0000-0000-0003-000000000001',
    city_id: '00000000-0000-0000-0001-000000000001',
    name: 'Public Works Department (PWD Road Infrastructure)',
    code: 'PWD-DEL',
    category_coverage: ['pothole', 'damaged_road', 'damaged_footpath', 'accessibility_barrier'],
    contact_email: 'infrastructure@pwd.delhi.gov.in',
    active: true,
  },
  {
    id: '00000000-0000-0000-0003-000000000002',
    city_id: '00000000-0000-0000-0001-000000000001',
    name: 'Delhi Jal Board (Drainage & Flood Control Unit)',
    code: 'DJB-DRAIN',
    category_coverage: ['blocked_drain', 'waterlogging'],
    contact_email: 'stormwater@jalboard.delhi.gov.in',
    active: true,
  },
  {
    id: '00000000-0000-0000-0003-000000000003',
    city_id: '00000000-0000-0000-0001-000000000001',
    name: 'MCD Solid Waste & Environmental Services',
    code: 'MCD-WASTE',
    category_coverage: ['overflowing_waste', 'plastic_litter', 'missed_waste_collection'],
    contact_email: 'sanitation@mcd.gov.in',
    active: true,
  },
  {
    id: '00000000-0000-0000-0003-000000000004',
    city_id: '00000000-0000-0000-0001-000000000001',
    name: 'BSES Yamuna Power / Streetlighting Cell',
    code: 'BSES-LIGHT',
    category_coverage: ['broken_streetlight'],
    contact_email: 'lighting@bses.delhi.gov.in',
    active: true,
  },
  {
    id: '00000000-0000-0000-0003-000000000005',
    city_id: '00000000-0000-0000-0001-000000000002',
    name: 'Ludhiana Municipal Corporation Engineering Wing',
    code: 'MC-LDH',
    category_coverage: ['pothole', 'blocked_drain', 'overflowing_waste', 'broken_streetlight', 'waterlogging'],
    contact_email: 'engineering@mcludhiana.gov.in',
    active: true,
  },
];

async function seed() {
  console.log('--- Idempotent Reference Data Seeding (No Fake Operational Data) ---');

  // 1. Cities (Idempotent by unique name and stable UUID)
  console.log('1. Seeding Cities...');
  for (const city of STABLE_CITIES) {
    const { error } = await supabase
      .from('cities')
      .upsert(city, { onConflict: 'name', ignoreDuplicates: true });
    if (error) console.error(`Error seeding city ${city.name}:`, error.message);
  }

  // 2. Jurisdictions (Idempotent by unique city_id + code)
  console.log('2. Seeding Jurisdictions...');
  for (const jur of STABLE_JURISDICTIONS) {
    const { error } = await supabase
      .from('jurisdictions')
      .upsert(jur, { onConflict: 'city_id,code', ignoreDuplicates: true });
    if (error) console.error(`Error seeding jurisdiction ${jur.name}:`, error.message);
  }

  // 3. Agencies (Idempotent by unique agency code)
  console.log('3. Seeding Agencies...');
  for (const agency of STABLE_AGENCIES) {
    const { error } = await supabase
      .from('agencies')
      .upsert(agency, { onConflict: 'code', ignoreDuplicates: true });
    if (error) console.error(`Error seeding agency ${agency.name}:`, error.message);
  }

  // 4. Priority Configurations (Idempotent by unique city_id)
  console.log('4. Seeding Default Priority Configuration...');
  const { error: pErr } = await supabase
    .from('priority_configurations')
    .upsert(
      {
        city_id: STABLE_CITIES[0].id,
        severity_weight: DEFAULT_PRIORITY_CONFIG.weights.severity,
        safety_impact_weight: DEFAULT_PRIORITY_CONFIG.weights.safety_impact,
        infrastructure_weight: DEFAULT_PRIORITY_CONFIG.weights.infrastructure,
        recurrence_weight: DEFAULT_PRIORITY_CONFIG.weights.recurrence,
        age_weight: DEFAULT_PRIORITY_CONFIG.weights.age,
        corroboration_weight: DEFAULT_PRIORITY_CONFIG.weights.corroboration,
        evidence_weight: DEFAULT_PRIORITY_CONFIG.weights.evidence,
        critical_threshold: DEFAULT_PRIORITY_CONFIG.thresholds.critical,
        high_threshold: DEFAULT_PRIORITY_CONFIG.thresholds.high,
        medium_threshold: DEFAULT_PRIORITY_CONFIG.thresholds.medium,
        emergency_keywords: DEFAULT_PRIORITY_CONFIG.emergency_keywords,
      },
      { onConflict: 'city_id', ignoreDuplicates: true }
    );
  if (pErr) console.error('Error seeding priority config:', pErr.message);

  console.log('--- Idempotent Reference Seeding Completed (Operational Data Untouched) ---');
}

seed().catch(err => {
  console.error('Seed script execution failed:', err);
  process.exit(1);
});
