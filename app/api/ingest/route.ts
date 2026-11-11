import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured, withSupabaseRetry } from '@/lib/supabaseAdmin';
import { generateEmbedding } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, content } = body;

    // 1. Validate required fields
    if (!title || !title.trim() || !category || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: Title, Category, and Content are required.' },
        { status: 400 }
      );
    }

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    // 2. Verify server-side Supabase client configuration
    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            'Supabase server-side client is not configured. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local.',
        },
        { status: 500 }
      );
    }

    // 3. Prevent duplicate document ingestion (Requirement 10)
    const { data: existingDocs, error: checkError } = await withSupabaseRetry<any[]>((client) =>
      client
        .from('documents')
        .select('id, title')
        .ilike('title', cleanTitle)
        .limit(1)
    );

    if (checkError) {
      console.warn('Duplicate check query warning:', checkError.message || checkError);
    } else if (existingDocs && Array.isArray(existingDocs) && existingDocs.length > 0) {
      return NextResponse.json(
        {
          error: `Duplicate Document: A document titled "${existingDocs[0].title}" already exists in the knowledge base. Please edit the existing document or use a unique title.`,
          duplicate: true,
          existingId: existingDocs[0].id,
        },
        { status: 409 }
      );
    }

    // 4. Generate 768-dim vector embedding using gemini-embedding-001 with automatic retry & backoff
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(cleanContent);
    } catch (embedErr: any) {
      console.error('Embedding generation failure in ingest route:', embedErr);
      const errMsg = (embedErr.message || '').toLowerCase();

      if (embedErr.status === 429 || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('resource_exhausted')) {
        return NextResponse.json(
          {
            error:
              'Gemini API quota exceeded (Rate limit 429). The system attempted exponential backoff, but the request limit was reached. Please wait a minute and retry.',
          },
          { status: 429 }
        );
      }

      if (errMsg.includes('econnreset') || errMsg.includes('enotfound') || errMsg.includes('fetch failed')) {
        return NextResponse.json(
          {
            error:
              'Network failure while connecting to Gemini embedding service. Please verify internet connectivity and retry.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: `Embedding generation error: ${embedErr.message || 'Failed to generate vector embedding.'}`,
        },
        { status: 500 }
      );
    }

    // 5. Insert document into Supabase with network failure resilience
    const { data: newDoc, error: insertError } = await withSupabaseRetry<any>((client) =>
      client
        .from('documents')
        .insert({
          title: cleanTitle,
          category,
          content: cleanContent,
          embedding,
        })
        .select()
        .single()
    );

    if (insertError) {
      console.error('Supabase ingest insert error:', insertError);

      if (insertError.code === '42501' || insertError.message?.includes('permission denied')) {
        return NextResponse.json(
          {
            error:
              'Database permission denied (42501): The server-side client lacks INSERT permission on the documents table. Verify that SUPABASE_SERVICE_ROLE_KEY is correctly configured.',
          },
          { status: 403 }
        );
      }

      const errMsg = (insertError.message || '').toLowerCase();
      if (errMsg.includes('econnreset') || errMsg.includes('enotfound')) {
        return NextResponse.json(
          {
            error:
              'Database network connection issue (ECONNRESET/ENOTFOUND). Could not connect to Supabase database. Please try again.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: 'live_supabase',
      document: newDoc,
      hasEmbedding: Boolean(embedding && embedding.length > 0),
    });
  } catch (err: any) {
    console.error('Ingest route unhandled exception:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during ingestion.' },
      { status: 500 }
    );
  }
}
