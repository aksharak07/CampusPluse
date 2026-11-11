import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ announcements: [], mode: 'no_database_connection' });
    }

    let query = supabaseAdmin
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('date', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetch announcements error:', error);
      return NextResponse.json({ announcements: [], mode: 'live_supabase' });
    }

    return NextResponse.json({ announcements: data || [], mode: 'live_supabase' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error fetching announcements' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, category, author, file_url, is_pinned } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required announcement fields' },
        { status: 400 }
      );
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase credentials are not configured.' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        description,
        category,
        author: author || 'Academic Affairs',
        file_url: file_url || null,
        is_pinned: is_pinned || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase create announcement error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcement: data, mode: 'live_supabase' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error creating announcement' },
      { status: 500 }
    );
  }
}

