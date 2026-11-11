-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS announcements;

-- 1. Create documents table for AI Knowledge Base RAG
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('exam', 'lab', 'placement', 'scholarship', 'general')),
  content TEXT NOT NULL,
  embedding vector(768), -- Gemini text-embedding-004 standard length
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create announcements table for Campus Notices & Downloads
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('exam', 'lab', 'placement', 'scholarship', 'general')),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_url TEXT,
  author TEXT DEFAULT 'Dean of Academic Affairs',
  is_pinned BOOLEAN DEFAULT false
);

-- Index vector embeddings using IVFFlat or HNSW for fast similarity retrieval
CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 3. SQL Vector Match Function (RPC match_documents)
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.category,
    documents.content,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Seed Data: Knowledge Base Documents (Pre-loaded for Instant AI Querying)
INSERT INTO documents (title, category, content) VALUES
('DSP Lab Semester 4 Examination Schedule', 'lab', 'The Digital Signal Processing (DSP) Lab final examination for Semester 4 B.Tech CSE & ECE students is scheduled for Friday, August 15, 2026. Batch A (Roll 1-30) exam starts at 9:00 AM in Lab 302. Batch B (Roll 31-60) starts at 1:30 PM. Students must bring signed lab manuals, hall tickets, and college ID card. Viva voce will carry 30 marks, practical implementation 40 marks, and lab manual 30 marks.'),

('Merit Cum Means Scholarship 2026 Eligibility', 'scholarship', 'Applications are open for the Annual Merit Cum Means (MCM) Scholarship 2026. Eligibility Criteria: 1. Minimum CGPA of 8.0 with no standing backlogs. 2. Annual family income must be below INR 6.5 Lakhs per annum. 3. Submission of authentic income certificate issued by Tehsildar or Gazetted Officer. Deadline for online application submission is August 25, 2026. Scholarship covers 75% of tuition fees for selected candidates.'),

('TCS Digital & Ninja Placement Drive 2026', 'placement', 'Tata Consultancy Services (TCS) placement drive for 2027 graduating batch (B.Tech CSE/IT/ECE/EEE) begins on September 2, 2026. Registration link closes on August 20, 2026 at 5:00 PM. Eligibility: Minimum 60% or 6.0 CGPA throughout 10th, 12th, and B.Tech. Maximum up to 1 active backlog permitted at the time of test. Package offered: TCS Digital - INR 7.5 LPA, TCS Ninja - INR 3.36 LPA.'),

('Mid-Semester 1 Examination Timetable', 'exam', 'Mid-Semester Examinations for all 3rd and 5th Semester B.Tech programs will commence from Monday, August 18, 2026 to Saturday, August 23, 2026. Examinations will be conducted in two shifts: Morning Shift (10:00 AM - 12:00 PM) and Afternoon Shift (2:00 PM - 4:00 PM). Seating plan will be published on the Main Notice Board outside Block B 24 hours prior to each exam.'),

('Central Library & Digital Lab Working Hours', 'general', 'Central Library and Computer Labs will remain open extended hours during mid-term and end-term exam weeks. Operating hours: Monday to Saturday 8:00 AM to 11:00 PM. Sunday 10:00 AM to 5:00 PM. High-speed WiFi (SSID: CampusPluse_HighSpeed) is available with student portal login credentials.'),

('Hardware Microprocessor Lab Guidelines', 'lab', 'Microprocessor and Interfacing Lab (ECE 304) equipment rules: 1. ESD wrist bands must be worn when working with 8086 kits and FPGA trainer boards. 2. Components damaged due to short circuiting will incur replacement cost. 3. Lab makeup sessions are held every Thursday from 4:00 PM to 6:00 PM with prior approval from Prof. Sharma.');

-- 6. Grant Access Permissions & Disable RLS for API roles
GRANT ALL ON TABLE documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE announcements TO anon, authenticated, service_role;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
GRANT EXECUTE ON FUNCTION match_documents TO anon, authenticated, service_role;

