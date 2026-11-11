import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { generateAndStoreEmbedding, regenerateAllEmbeddings } from '@/lib/rag';

// GET /api/documents - List all documents in Supabase with vector embedding status
export async function GET() {
  try {
    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ documents: [], mode: 'no_database_connection' });
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, title, category, content, created_at, embedding')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const docs = (data || []).map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      content: doc.content,
      created_at: doc.created_at,
      hasEmbedding: Boolean(doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length > 0),
    }));

    return NextResponse.json({ documents: docs, mode: 'live_supabase' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch documents' }, { status: 500 });
  }
}

// PUT /api/documents - Update an existing document and automatically regenerate its vector embedding
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, category, content } = body;

    if (!id || !title || !category || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: id, title, category, and content are required.' },
        { status: 400 }
      );
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    // Step 1: Update document fields in Supabase
    const { data, error } = await supabaseAdmin
      .from('documents')
      .update({
        title,
        category,
        content,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Step 2: Automatically regenerate vector embedding for the updated content
    const embedding = await generateAndStoreEmbedding(id, content);

    return NextResponse.json({
      success: true,
      document: data,
      embeddingGenerated: Boolean(embedding),
      message: 'Document updated and vector embedding regenerated in Supabase.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating document' }, { status: 500 });
  }
}

// POST /api/documents - Force reindex / regenerate all vector embeddings in Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'reindex') {
      const result = await regenerateAllEmbeddings();
      return NextResponse.json({
        success: result.success,
        reindexedCount: result.count,
        message: `Successfully regenerated embeddings for ${result.count} documents in Supabase.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error processing request' }, { status: 500 });
  }
}
