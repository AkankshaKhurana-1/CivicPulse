import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { dbRepository } from '../lib/db/repository';

// Load .env.local if present
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
const isLiveConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  !supabaseUrl.includes('your-project-id') &&
  !serviceRoleKey.includes('...')
);

// Group 1: Configuration & Environment Audit (Always executes)
describe('Supabase Environment & Configuration Audit', () => {
  it('confirms whether live credentials are provided in .env.local', () => {
    if (!isLiveConfigured) {
      console.info('ℹ️  STATUS: Live Supabase database credentials NOT detected in .env.local. Live integration tests will be marked [skipped].');
      expect(isLiveConfigured).toBe(false);
    } else {
      console.info('ℹ️  STATUS: Live Supabase database credentials detected.');
      expect(isLiveConfigured).toBe(true);
    }
  });
});

// Group 2: Live Network Database Integration Tests (Explicitly SKIPPED unless live credentials exist)
describe.skipIf(!isLiveConfigured)('Live Supabase PostgreSQL Integration Suite (Live Network)', () => {
  it('connects to Supabase and verifies core tables exist', async () => {
    const client = createClient(supabaseUrl!, serviceRoleKey!);
    const { data, error } = await client.from('cities').select('*').limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('performs isolated CRUD lifecycle on test report with automatic cleanup', async () => {
    const client = createClient(supabaseUrl!, serviceRoleKey!);
    const testCode = `TEST-CP-E2E-${Date.now()}`;

    // 1. Insert real report into Supabase PostgreSQL
    const { data: inserted, error: insertErr } = await client
      .from('reports')
      .insert({
        reference_code: testCode,
        category: 'pothole',
        title: 'Live Supabase Automated Integration Test Report',
        description: 'Verifying real PostgreSQL row insertion and retrieval with automatic cleanup.',
        lat: 28.6139,
        lng: 77.2090,
        address: 'Connaught Place, New Delhi',
        privacy_level: 'PUBLIC',
        status: 'SUBMITTED',
      })
      .select()
      .single();

    expect(insertErr).toBeNull();
    expect(inserted).toBeDefined();
    expect(inserted.reference_code).toBe(testCode);

    // 2. Fetch report through repository
    const retrieved = await dbRepository.getReportById(testCode);
    expect(retrieved).toBeDefined();
    expect(retrieved?.reference_code).toBe(testCode);

    // 3. Isolated cleanup: Remove only this test record (never touch user data)
    const { error: delErr } = await client.from('reports').delete().eq('id', inserted.id);
    expect(delErr).toBeNull();
  });
});
