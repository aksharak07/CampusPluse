import { supabaseAdmin, isSupabaseAdminConfigured, withSupabaseRetry } from './supabaseAdmin';
import { generateEmbedding } from './gemini';

export interface VectorSearchResult {
  id: string;
  title: string;
  category: string;
  content: string;
  similarity?: number;
  sourceTable?: 'documents' | 'announcements';
}

/**
 * Helper to pause execution between sequential calls
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates a 768-dim embedding for content and updates the document row in Supabase
 */
export async function generateAndStoreEmbedding(docId: string, content: string): Promise<number[] | null> {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin || !content.trim()) return null;

  try {
    const embedding = await generateEmbedding(content);
    if (!embedding || embedding.length === 0) {
      return null;
    }

    const { error } = await withSupabaseRetry<any>((client) =>
      client
        .from('documents')
        .update({ embedding })
        .eq('id', docId)
    );

    if (error) {
      console.error(`Failed to store embedding for document ${docId}:`, error.message);
      return null;
    }

    return embedding;
  } catch (err: any) {
    console.error(`Error in generateAndStoreEmbedding for ${docId}:`, err.message || err);
    return null;
  }
}

/**
 * Auto-detects documents in Supabase missing vector embeddings and populates them sequentially
 * with pacing to respect Gemini API rate limits.
 */
export async function ensureEmbeddingsUpToDate(batchSize: number = 5, delayBetweenMs: number = 1500): Promise<number> {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) return 0;

  try {
    const { data: missingDocs, error } = await withSupabaseRetry<any[]>((client) =>
      client
        .from('documents')
        .select('id, content')
        .is('embedding', null)
        .limit(batchSize)
    );

    if (error || !missingDocs || !Array.isArray(missingDocs) || missingDocs.length === 0) {
      return 0;
    }

    console.log(`Found ${missingDocs.length} documents missing embeddings in Supabase. Generating sequentially...`);
    let updatedCount = 0;

    for (let i = 0; i < missingDocs.length; i++) {
      const doc = missingDocs[i];
      if (doc.content) {
        try {
          const result = await generateAndStoreEmbedding(doc.id, doc.content);
          if (result) updatedCount++;
        } catch (itemErr: any) {
          console.warn(`Sequential embedding generation warning for doc ${doc.id}:`, itemErr.message || itemErr);
        }

        // Pacing delay between sequential embeddings to prevent 429 quota exhaustion
        if (i < missingDocs.length - 1 && delayBetweenMs > 0) {
          await delay(delayBetweenMs);
        }
      }
    }

    return updatedCount;
  } catch (err: any) {
    console.warn('Error in ensureEmbeddingsUpToDate:', err.message || err);
    return 0;
  }
}

/**
 * Regenerates vector embeddings sequentially for ALL documents in Supabase with batch pacing
 */
export async function regenerateAllEmbeddings(batchDelayMs: number = 1500): Promise<{ success: boolean; count: number }> {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
    return { success: false, count: 0 };
  }

  try {
    const { data: allDocs, error } = await withSupabaseRetry<any[]>((client) =>
      client
        .from('documents')
        .select('id, content')
    );

    if (error || !allDocs || !Array.isArray(allDocs)) {
      return { success: false, count: 0 };
    }

    let count = 0;
    for (let i = 0; i < allDocs.length; i++) {
      const doc = allDocs[i];
      if (doc.content) {
        try {
          const res = await generateAndStoreEmbedding(doc.id, doc.content);
          if (res) count++;
        } catch (itemErr: any) {
          console.error(`Failed embedding on document ${doc.id}:`, itemErr.message || itemErr);
        }

        // Inter-document pacing delay
        if (i < allDocs.length - 1 && batchDelayMs > 0) {
          await delay(batchDelayMs);
        }
      }
    }

    return { success: true, count };
  } catch (err: any) {
    console.error('Error in regenerateAllEmbeddings:', err.message || err);
    return { success: false, count: 0 };
  }
}

/**
 * Performs vector similarity search over Supabase documents using pgvector match_documents RPC
 */
export async function vectorSearch(
  queryEmbedding: number[],
  matchCount: number = 5,
  matchThreshold: number = 0.25
): Promise<VectorSearchResult[]> {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin || !queryEmbedding || queryEmbedding.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (!error && data && Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        content: d.content,
        similarity: d.similarity,
        sourceTable: 'documents' as const,
      }));
    }

    return [];
  } catch (err: any) {
    console.warn('Vector search RPC error or not configured:', err.message || err);
    return [];
  }
}

/**
 * Category intent mapping keywords
 */
const CATEGORY_MAP: Record<string, string[]> = {
  exam: ['exam', 'exams', 'examination', 'examinations', 'midsem', 'mid-sem', 'mid-semester', 'endsem', 'end-sem', 'datesheet', 'timetable', 'commence', 'seating'],
  lab: ['lab', 'labs', 'laboratory', 'practical', 'viva', 'manual', 'dsp', 'microprocessor', 'hardware', 'kit', 'fpga', '8086'],
  placement: ['placement', 'placements', 'drive', 'drives', 'job', 'jobs', 'internship', 'tcs', 'ctc', 'package', 'ninja', 'digital', 'recruitment', 'salary', 'lpa', 'backlog'],
  scholarship: ['scholarship', 'scholarships', 'grant', 'grants', 'mcm', 'merit', 'income', 'stipend', 'fee', 'fees', 'tuition', 'tehsildar', 'cgpa'],
  general: ['library', 'wifi', 'timings', 'hours', 'hostel', 'campus', 'general', 'notice', 'ssid', 'working hours']
};

/**
 * Detect explicit category intent from student query
 */
export function detectCategoryIntent(query: string): string | null {
  const lower = query.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return category;
      }
    }
  }
  return null;
}

/**
 * Extracts meaningful keyword tokens from user query
 */
export function extractKeywords(query: string): string[] {
  const stopWords = new Set([
    'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'can', 'could', 'should', 'would', 'may', 'might',
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'for', 'of',
    'at', 'by', 'from', 'in', 'into', 'on', 'to', 'with', 'about', 'against',
    'tell', 'me', 'please', 'give', 'details', 'detail', 'information', 'info',
    'want', 'know', 'need', 'show', 'any'
  ]);

  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !stopWords.has(word));
}

/**
 * Calculates relevance score across Title, Category, and Content
 */
export function calculateRelevance(
  queryTokens: string[],
  normalizedQuery: string,
  targetCategory: string | null,
  title: string,
  category: string,
  content: string
): number {
  let score = 0;
  const normTitle = (title || '').toLowerCase();
  const normCategory = (category || '').toLowerCase();
  const normContent = (content || '').toLowerCase();

  // 1. Exact phrase matches in Title or Content
  if (normalizedQuery.length >= 4 && normTitle.includes(normalizedQuery)) {
    score += 45;
  }
  if (normalizedQuery.length >= 6 && normContent.includes(normalizedQuery)) {
    score += 25;
  }

  // 2. Category matching (Requirement 2)
  if (targetCategory && (normCategory === targetCategory || normCategory.includes(targetCategory))) {
    score += 30;
  }
  for (const token of queryTokens) {
    if (normCategory === token || normCategory.includes(token)) {
      score += 15;
    }
  }

  // 3. Keyword matches in Title (weight 12x) and Content (weight 4x)
  let matchedTitleTokens = 0;
  let matchedContentTokens = 0;

  for (const token of queryTokens) {
    if (normTitle.includes(token)) {
      matchedTitleTokens++;
      score += 12;
    }
    if (normContent.includes(token)) {
      matchedContentTokens++;
      score += 4;
    }
  }

  // Multi-token overlap bonus
  if (queryTokens.length > 0) {
    const overlapRatio = (matchedTitleTokens * 2 + matchedContentTokens) / (queryTokens.length * 2);
    score += Math.min(overlapRatio * 20, 20);
  }

  // 4. Specific domain question intent boosts (Dates, Venues, Timetables)
  const isDateQuery = /when|date|day|time|timing|schedule|timetable|commence|commencing|start/i.test(normalizedQuery);
  const isVenueQuery = /where|venue|room|hall|lab|location|place|block|seating/i.test(normalizedQuery);

  if (isDateQuery) {
    if (normTitle.includes('schedule') || normTitle.includes('timetable') || normTitle.includes('date')) {
      score += 15;
    }
    if (/august|commence|\d{1,2}:\d{2}\s*(?:am|pm)|morning|afternoon/i.test(normContent)) {
      score += 10;
    }
  }

  if (isVenueQuery) {
    if (/lab\s*\d+|block\s*[a-z]|room\s*\d+|hall/i.test(normContent) || /lab\s*\d+|block\s*[a-z]/i.test(normTitle)) {
      score += 15;
    }
  }

  return score;
}

/**
 * Performs structured keyword/text search across Supabase documents and announcements tables
 * Using Title, Category, and Content
 */
export async function keywordSearch(
  userQuery: string,
  matchCount: number = 5
): Promise<VectorSearchResult[]> {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) return [];

  const normalizedQuery = userQuery.toLowerCase().trim();
  const keywords = extractKeywords(normalizedQuery);
  const targetCategory = detectCategoryIntent(normalizedQuery);

  const results: (VectorSearchResult & { relevance: number })[] = [];
  const seenIds = new Set<string>();

  try {
    // 1. Fetch from documents table
    const { data: matchedDocs, error: docErr } = await supabaseAdmin
      .from('documents')
      .select('id, title, category, content');

    if (docErr) {
      console.warn('Supabase documents query error:', docErr.message || docErr);
    } else if (matchedDocs) {
      for (const doc of matchedDocs) {
        const score = calculateRelevance(
          keywords,
          normalizedQuery,
          targetCategory,
          doc.title,
          doc.category,
          doc.content
        );

        if (score > 0) {
          seenIds.add(doc.id);
          results.push({
            id: doc.id,
            title: doc.title,
            category: doc.category,
            content: doc.content,
            sourceTable: 'documents',
            similarity: Math.min(Number((score / 100).toFixed(3)), 0.99),
            relevance: score,
          });
        }
      }
    }

    // 2. Fetch from announcements table (Requirement 5)
    const { data: matchedAncs, error: ancErr } = await supabaseAdmin
      .from('announcements')
      .select('id, title, category, description, date, author');

    if (ancErr) {
      console.warn('Supabase announcements query error:', ancErr.message || ancErr);
    } else if (matchedAncs) {
      for (const anc of matchedAncs) {
        if (!seenIds.has(anc.id)) {
          const content = `${anc.description} (Date: ${anc.date ? new Date(anc.date).toLocaleDateString() : 'Recent'}, Author: ${anc.author || 'Academic Affairs'})`;
          const score = calculateRelevance(
            keywords,
            normalizedQuery,
            targetCategory,
            anc.title,
            anc.category,
            content
          );

          if (score > 5) {
            seenIds.add(anc.id);
            results.push({
              id: anc.id,
              title: anc.title,
              category: anc.category,
              content,
              sourceTable: 'announcements',
              similarity: Math.min(Number((score / 100).toFixed(3)), 0.95),
              relevance: score,
            });
          }
        }
      }
    }

    results.sort((a, b) => b.relevance - a.relevance);
    return results.slice(0, matchCount).map(({ relevance, ...item }) => item);
  } catch (err: any) {
    console.warn('Keyword search error:', err.message || err);
    return [];
  }
}

/**
 * Unified Direct Database Retrieval Pipeline:
 * 1. Directly queries the Supabase `documents` table (Requirement 1)
 * 2. Uses Title, Category, and Content to identify relevant records (Requirement 2)
 * 3. Also retrieves actual records from the `announcements` table (Requirement 5)
 * 4. Does NOT require embeddings for basic structured database retrieval (Requirement 7)
 * 5. Enhances with vector similarity search if embeddings are available without blocking (Requirement 8)
 * 6. Returns strictly grounded context records to pass to AI (Requirement 3)
 */
export async function retrieveContextDocuments(
  userQuery: string,
  matchCount: number = 5
): Promise<VectorSearchResult[]> {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) return [];

  const normalizedQuery = userQuery.toLowerCase().trim();
  const queryTokens = extractKeywords(normalizedQuery);
  const targetCategory = detectCategoryIntent(normalizedQuery);

  const candidateMap = new Map<string, VectorSearchResult & { relevance: number }>();

  // STEP 1: Direct Structured Database Retrieval from `documents` table
  try {
    const { data: dbDocs, error: docErr } = await supabaseAdmin
      .from('documents')
      .select('id, title, category, content');

    if (docErr) {
      console.error('Supabase query error on documents table:', docErr);
      throw docErr;
    }

    if (dbDocs && Array.isArray(dbDocs)) {
      for (const doc of dbDocs) {
        const score = calculateRelevance(
          queryTokens,
          normalizedQuery,
          targetCategory,
          doc.title,
          doc.category,
          doc.content
        );

        if (score > 0) {
          candidateMap.set(doc.id, {
            id: doc.id,
            title: doc.title,
            category: doc.category,
            content: doc.content,
            sourceTable: 'documents',
            similarity: Math.min(Number((score / 100).toFixed(3)), 0.99),
            relevance: score,
          });
        }
      }
    }
  } catch (docFetchErr: any) {
    console.error('Error in direct documents retrieval:', docFetchErr.message || docFetchErr);
    throw docFetchErr;
  }

  // STEP 2: Direct Structured Database Retrieval from `announcements` table (Requirement 5)
  try {
    const { data: dbAncs, error: ancErr } = await supabaseAdmin
      .from('announcements')
      .select('id, title, category, description, date, author');

    if (!ancErr && dbAncs && Array.isArray(dbAncs)) {
      for (const anc of dbAncs) {
        if (!candidateMap.has(anc.id)) {
          const content = `${anc.description} (Date: ${anc.date ? new Date(anc.date).toLocaleDateString() : 'Recent'}, Author: ${anc.author || 'Academic Affairs'})`;
          const score = calculateRelevance(
            queryTokens,
            normalizedQuery,
            targetCategory,
            anc.title,
            anc.category,
            content
          );

          if (score > 5) {
            candidateMap.set(anc.id, {
              id: anc.id,
              title: anc.title,
              category: anc.category,
              content,
              sourceTable: 'announcements',
              similarity: Math.min(Number((score / 100).toFixed(3)), 0.95),
              relevance: score,
            });
          }
        }
      }
    }
  } catch (ancFetchErr: any) {
    console.warn('Error in direct announcements retrieval:', ancFetchErr.message || ancFetchErr);
  }

  // STEP 3: Optional Vector Similarity Enhancement (Requirement 7: Not required, non-blocking)
  try {
    const queryEmbedding = await generateEmbedding(userQuery);
    if (queryEmbedding && queryEmbedding.length > 0) {
      const vectorMatches = await vectorSearch(queryEmbedding, matchCount, 0.25);
      for (const vm of vectorMatches) {
        if (candidateMap.has(vm.id)) {
          const existing = candidateMap.get(vm.id)!;
          existing.relevance += (vm.similarity || 0.5) * 20;
          if (vm.similarity && vm.similarity > (existing.similarity || 0)) {
            existing.similarity = vm.similarity;
          }
        } else {
          candidateMap.set(vm.id, {
            ...vm,
            relevance: (vm.similarity || 0.3) * 30,
          });
        }
      }
    }
  } catch (vecErr) {
    // Graceful continuation: Structured database retrieval does not depend on vector RPC
    console.log('Vector similarity enhancement skipped:', vecErr);
  }

  const results = Array.from(candidateMap.values());
  results.sort((a, b) => b.relevance - a.relevance);

  return results.slice(0, matchCount).map(({ relevance, ...item }) => item);
}
