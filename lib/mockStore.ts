import { Announcement, DocumentItem } from '@/types';

// Empty store - Strictly uses Supabase documents table
export const INITIAL_DOCUMENTS: DocumentItem[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export function getMockDocuments(): DocumentItem[] {
  return [];
}

export function addMockDocument(doc: Omit<DocumentItem, 'id' | 'created_at'>): DocumentItem {
  const newDoc: DocumentItem = {
    ...doc,
    id: `doc-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  return newDoc;
}

export function getMockAnnouncements(): Announcement[] {
  return [];
}

export function addMockAnnouncement(anc: Omit<Announcement, 'id' | 'date'>): Announcement {
  const newAnc: Announcement = {
    ...anc,
    id: `anc-${Date.now()}`,
    date: new Date().toISOString(),
  };
  return newAnc;
}

export function searchMockDocuments(query: string, limit: number = 4): DocumentItem[] {
  return [];
}


