export type CategoryType = 'all' | 'exam' | 'lab' | 'placement' | 'scholarship' | 'general';

export interface Announcement {
  id: string;
  title: string;
  description: string;
  category: Exclude<CategoryType, 'all'>;
  date: string;
  author?: string;
  file_url?: string | null;
  is_pinned?: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: Exclude<CategoryType, 'all'>;
  content: string;
  embedding?: number[];
  created_at?: string;
  similarity?: number;
}

export interface Citation {
  id: string;
  title: string;
  category: string;
  snippet: string;
  similarity?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

export interface IngestPayload {
  title: string;
  category: Exclude<CategoryType, 'all'>;
  content: string;
}

export interface ChatApiRequest {
  prompt: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface ChatApiResponse {
  response: string;
  citations: Citation[];
  mode: 'live_supabase' | 'demo_mock' | 'no_database_connection';
  dbWarning?: string;
}
