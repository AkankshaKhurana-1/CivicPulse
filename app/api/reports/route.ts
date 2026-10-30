import { NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createReportSchema = z.object({
  category: z.enum([
    'blocked_drain', 'waterlogging', 'overflowing_waste', 'plastic_litter',
    'missed_waste_collection', 'pothole', 'damaged_road', 'broken_streetlight',
    'damaged_footpath', 'accessibility_barrier', 'other'
  ]),
  title: z.string().min(3),
  description: z.string().min(5),
  lat: z.number(),
  lng: z.number(),
  gps_accuracy: z.number().optional(),
  location_source: z.enum(['gps', 'manual_pin', 'exif', 'address_geocoded']).optional(),
  capture_timestamp: z.string().optional(),
  address: z.string(),
  images: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const reports = await dbRepository.getReports();
    return NextResponse.json({ success: true, count: reports.length, data: reports });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Authenticate caller on the server; never trust arbitrary reporter_id from request body
    const supabase = createServerSupabaseClient();
    let authenticatedUserId: string | undefined = undefined;
    let reporterDisplayName: string = 'Anonymous Citizen';

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        authenticatedUserId = user.id;
        reporterDisplayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Citizen';
      }
    }

    const body = await request.json();
    const validated = createReportSchema.parse(body);

    const report = await dbRepository.addReport({
      reporter_id: authenticatedUserId,
      reporter_name: reporterDisplayName,
      category: validated.category,
      title: validated.title,
      description: validated.description,
      lat: validated.lat,
      lng: validated.lng,
      gps_accuracy: validated.gps_accuracy,
      location_source: validated.location_source,
      capture_timestamp: validated.capture_timestamp,
      address: validated.address,
      city_id: '00000000-0000-0000-0001-000000000001',
      jurisdiction_id: '00000000-0000-0000-0002-000000000001',
      privacy_level: 'PUBLIC',
      images: validated.images || [],
    });

    return NextResponse.json({ success: true, message: 'Report created successfully', data: report }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.errors || err.message }, { status: 400 });
  }
}
