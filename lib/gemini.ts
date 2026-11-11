import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const isGeminiConfigured = () => {
  return Boolean(apiKey) && !apiKey.includes('your-gemini');
};

const genAI = isGeminiConfigured() ? new GoogleGenerativeAI(apiKey) : null;

// The single, official embedding model for Campus Copilot
const EMBEDDING_MODEL_NAME = 'gemini-embedding-001';

/**
 * Helper to pause execution
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parses retry delay from error message or response headers when 429 occurs
 */
function extractRetryDelay(error: any, attempt: number, baseDelayMs: number = 2000): number {
  if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
    // Check for "Retry-After" or seconds mentioned in error message
    const msg = error.message || '';
    const matchSeconds = msg.match(/retry after (\d+)/i) || msg.match(/after (\d+)s/i);
    if (matchSeconds && matchSeconds[1]) {
      return (parseInt(matchSeconds[1], 10) + 1) * 1000;
    }
    // Exponential backoff with jitter: 2s, 4s, 8s, 16s + jitter
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.floor(Math.random() * 500);
    return exponentialDelay + jitter;
  }
  // Transient network error delay
  return 1500 * (attempt + 1);
}

/**
 * Checks if error is transient (network failure or 429 rate limit)
 */
function isTransientError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const status = error.status;

  return (
    status === 429 ||
    status === 503 ||
    status === 500 ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('econnreset') ||
    msg.includes('enotfound') ||
    msg.includes('etimedout') ||
    msg.includes('fetch failed') ||
    msg.includes('network')
  );
}

/**
 * Generate 768-dimensional vector embedding for text using gemini-embedding-001
 * with automatic exponential backoff for 429 quota limits and network retries.
 */
export async function generateEmbedding(
  text: string,
  options: { maxRetries?: number; initialDelayMs?: number } = {}
): Promise<number[] | null> {
  if (!genAI || !text || !text.trim()) {
    return null;
  }

  const { maxRetries = 4, initialDelayMs = 2000 } = options;
  const cleanText = text.trim();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });
      const result = await model.embedContent({
        content: { role: 'user', parts: [{ text: cleanText }] },
        outputDimensionality: 768,
      } as any);

      if (result?.embedding?.values && result.embedding.values.length > 0) {
        return result.embedding.values;
      }
      return null;
    } catch (err: any) {
      const isLastAttempt = attempt === maxRetries;
      if (!isTransientError(err) || isLastAttempt) {
        console.error(`Embedding generation failed on attempt ${attempt + 1}/${maxRetries + 1}:`, err.message || err);
        throw err;
      }

      const delayMs = extractRetryDelay(err, attempt, initialDelayMs);
      console.warn(
        `Gemini embedding rate-limit / network hiccup (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(
          delayMs / 1000
        )}s...`
      );
      await sleep(delayMs);
    }
  }

  return null;
}

/**
 * Sequential batch embedding generator with configurable batch size and inter-batch pacing
 * to prevent hitting Gemini 15 RPM free tier limits.
 */
export async function generateSequentialEmbeddings(
  texts: string[],
  options: { batchSize?: number; delayBetweenBatchesMs?: number; maxRetries?: number } = {}
): Promise<(number[] | null)[]> {
  const { batchSize = 1, delayBetweenBatchesMs = 1200, maxRetries = 4 } = options;
  const results: (number[] | null)[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize);
    const chunkResults = await Promise.all(
      chunk.map((text) => generateEmbedding(text, { maxRetries }))
    );
    results.push(...chunkResults);

    // Apply inter-batch delay if more chunks remain
    if (i + batchSize < texts.length && delayBetweenBatchesMs > 0) {
      await sleep(delayBetweenBatchesMs);
    }
  }

  return results;
}

/**
 * Generate student-friendly, precise RAG answer grounded strictly in retrieved Supabase documents
 */
export async function generateRAGAnswer(
  userQuery: string,
  contextDocuments: { title: string; content: string; category: string }[]
): Promise<string> {
  if (!genAI) {
    return formatLiveContextResponse(userQuery, contextDocuments);
  }

  const contextText = (contextDocuments || [])
    .map(
      (doc, index) =>
        `[Record ${index + 1}: ${doc.title} (Category: ${doc.category})]\n${doc.content}`
    )
    .join('\n\n');

  const hasContext = contextDocuments && contextDocuments.length > 0;

  const prompt = `
You are CampusCopilot AI Assistant, the official AI assistant for students.
Answer the student's question accurately, concisely, and politely using ONLY the official Supabase database records provided below.

STRICT GROUNDING & ACCURACY RULES:
1. Base your answer STRICTLY and SOLELY on the provided Official Supabase Records.
2. When answering questions regarding exam dates, timetables, venues, shifts, batches, eligibility criteria, or packages:
   - Always extract and present the EXACT dates, days, timings, and venues (e.g., room numbers, labs, blocks) found in the database records.
   - Present the details in clear, well-structured bullet points.
   - Highlight key values (dates, times, venues, room numbers, batches) in **bold**.
3. Always cite the document title (and category) as the verified source at the end.
4. If no records are provided or the answer cannot be found in the records, state clearly:
   "I could not find official information regarding this in the campus records. Please check with the respective academic department or campus notice board."
   DO NOT guess or invent facts, dates, venues, or criteria.

Official Supabase Records:
---
${hasContext ? contextText : 'NO_RECORDS_FOUND_IN_DATABASE'}
---

Student Question: "${userQuery}"
`;

  // Candidate generation models in priority order
  const candidateModels = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      if (responseText && responseText.trim()) {
        return responseText.trim();
      }
    } catch (error: any) {
      console.warn(`Gemini generation attempt with ${modelName} failed:`, error.message || error);
    }
  }

  // Fallback to grounded template if all Gemini generation calls fail
  return formatLiveContextResponse(userQuery, contextDocuments);
}

/**
 * Format response directly from retrieved live database documents if Gemini API call is unavailable
 */
function formatLiveContextResponse(
  query: string,
  docs: { title: string; content: string; category: string }[]
): string {
  if (!docs || docs.length === 0) {
    return `I could not find official information regarding **"${query}"** in the campus database records. Please consult the academic administration or the campus notice board.`;
  }

  const primary = docs[0];
  const bulletDetails = primary.content
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .map((s) => `• ${s.trim()}`)
    .join('\n');

  return `Based on official campus records for **"${primary.title}"**:\n\n${bulletDetails}\n\n*Source: ${primary.title} [${primary.category.toUpperCase()}]*`;
}
