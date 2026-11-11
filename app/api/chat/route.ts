import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { generateRAGAnswer } from '@/lib/gemini';
import { retrieveContextDocuments } from '@/lib/rag';
import { Citation } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt string is required.' },
        { status: 400 }
      );
    }

    let contextDocuments: any[] = [];
    let activeMode: 'live_supabase' | 'no_database_connection' = 'no_database_connection';
    let dbErrorMessage: string | null = null;

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      try {
        // Retrieve relevant records directly from Supabase documents & announcements tables
        contextDocuments = await retrieveContextDocuments(prompt, 5);
        activeMode = 'live_supabase';
      } catch (dbErr: any) {
        console.error('Supabase query error in chat route:', dbErr);
        dbErrorMessage = dbErr.message || 'Database connection error';
        if (dbErr.code === '42501' || dbErr.message?.includes('permission denied')) {
          dbErrorMessage = `PERMISSION_DENIED: ${dbErr.message}`;
        }
      }
    } else {
      console.warn('Supabase is not configured or admin client is unavailable.');
    }

    // Generate response using Gemini strictly grounded in retrieved Supabase context
    let answer = await generateRAGAnswer(prompt, contextDocuments);

    // If Supabase encountered an error, provide clear guidance
    if (dbErrorMessage && (!contextDocuments || contextDocuments.length === 0)) {
      if (dbErrorMessage.includes('PERMISSION_DENIED') || dbErrorMessage.includes('permission denied')) {
        answer = `⚠️ **Supabase Permission Required**: Successfully connected to your Supabase project, but PostgreSQL table permissions need to be granted for the API to read the \`documents\` and \`announcements\` tables.\n\nPlease open your **[Supabase Dashboard SQL Editor](https://supabase.com/dashboard)** and run lines 81–85 of \`supabase/schema.sql\`:\n\n\`\`\`sql\nGRANT ALL ON TABLE documents TO anon, authenticated, service_role;\nGRANT ALL ON TABLE announcements TO anon, authenticated, service_role;\nALTER TABLE documents DISABLE ROW LEVEL SECURITY;\nALTER TABLE announcements DISABLE ROW LEVEL SECURITY;\nGRANT EXECUTE ON FUNCTION match_documents TO anon, authenticated, service_role;\n\`\`\`\n\nOnce executed, queries will immediately pull live records from your database.`;
      } else if (dbErrorMessage.includes('ENOTFOUND') || dbErrorMessage.includes('fetch failed')) {
        answer = `⚠️ **Database Connection Notice**: Could not establish connection to the Supabase database.\n\nIf your Supabase project was paused due to inactivity, please open your [Supabase Dashboard](https://supabase.com/dashboard) and click **Restore project** to reconnect.`;
      }
    }

    // Format citations strictly from retrieved Supabase records
    const citations: Citation[] = (contextDocuments || []).map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      snippet: doc.content.length > 150 ? doc.content.substring(0, 150) + '...' : doc.content,
      similarity: doc.similarity,
    }));

    return NextResponse.json({
      response: answer,
      citations,
      mode: activeMode,
      ...(dbErrorMessage ? { dbWarning: dbErrorMessage } : {}),
    });
  } catch (err: any) {
    console.error('Chat API route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing chat query.' },
      { status: 500 }
    );
  }
}
