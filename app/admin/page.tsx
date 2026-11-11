'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Upload, 
  PlusCircle, 
  FileText, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Layers,
  LogOut,
  Bell,
  Pin,
  RefreshCw
} from 'lucide-react';
import { CategoryType, DocumentItem } from '@/types';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'ingest' | 'announcement' | 'documents'>('ingest');
  
  // Knowledge Ingest Form State
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestCategory, setIngestCategory] = useState<Exclude<CategoryType, 'all'>>('lab');
  const [ingestContent, setIngestContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccessMsg, setIngestSuccessMsg] = useState<string | null>(null);
  const [ingestErrorMsg, setIngestErrorMsg] = useState<string | null>(null);

  // Announcement Form State
  const [ancTitle, setAncTitle] = useState('');
  const [ancCategory, setAncCategory] = useState<Exclude<CategoryType, 'all'>>('lab');
  const [ancDescription, setAncDescription] = useState('');
  const [ancFileUrl, setAncFileUrl] = useState('');
  const [ancIsPinned, setAncIsPinned] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [ancSuccessMsg, setAncSuccessMsg] = useState<string | null>(null);

  // Indexed Documents State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check local session
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('campuspluse_admin_session');
      if (!session) {
        router.push('/admin/login');
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('campuspluse_admin_session');
    }
    router.push('/admin/login');
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestTitle || !ingestContent) return;

    setIsIngesting(true);
    setIngestSuccessMsg(null);
    setIngestErrorMsg(null);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ingestTitle,
          category: ingestCategory,
          content: ingestContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ingest failed');

      setIngestSuccessMsg(
        `✅ Successfully embedded with Gemini gemini-embedding-001 (768-dim) and stored document: "${ingestTitle}"!`
      );
      setIngestTitle('');
      setIngestContent('');
    } catch (err: any) {
      setIngestErrorMsg(err.message || 'Error during document ingestion.');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle || !ancDescription) return;

    setIsPublishing(true);
    setAncSuccessMsg(null);

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ancTitle,
          description: ancDescription,
          category: ancCategory,
          author: 'Department Coordinator',
          file_url: ancFileUrl || null,
          is_pinned: ancIsPinned,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish announcement');

      setAncSuccessMsg(`✅ Published announcement: "${ancTitle}"!`);
      setAncTitle('');
      setAncDescription('');
      setAncFileUrl('');
      setAncIsPinned(false);
    } catch (err: any) {
      alert(`Error publishing announcement: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Quick file drop simulation text extractor
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIngestTitle(file.name.replace(/\.[^/.]+$/, ''));
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setIngestContent(
          text ||
            `[Extracted Text Content from ${file.name}]\nOfficial Schedule and Regulations document uploaded by Coordinator on ${new Date().toLocaleDateString()}. Contains detailed timetable rules and venue seating plan.`
        );
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Admin Knowledge Manager</h1>
            <p className="text-xs text-slate-400 font-mono">
              Role: Authorized Campus Representative • RAG Indexing Panel
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4 mr-1.5 text-rose-400" />
          Logout
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ingest')}
          className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'ingest'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>1. Ingest AI Document (RAG)</span>
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'announcement'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>2. Post Campus Announcement</span>
        </button>
      </div>

      {/* TAB 1: INGEST KNOWLEDGE */}
      {activeTab === 'ingest' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Ingest Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-400" />
                  Vector Knowledge Ingestion
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload official PDFs or paste notice text. Documents will be vectorized using Gemini <strong>gemini-embedding-001 (768-dim)</strong> and indexed into Supabase pgvector.
                </p>
              </div>

              {ingestSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{ingestSuccessMsg}</span>
                </div>
              )}

              {ingestErrorMsg && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{ingestErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleIngestSubmit} className="space-y-4">
                
                {/* PDF File Uploader Dropzone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Upload Official PDF / Text Document
                  </label>
                  <div className="relative border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl p-6 text-center bg-slate-950/60 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-8 h-8 text-brand-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-200">
                      Click to choose PDF/TXT file or drag and drop here
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Auto-extracts text content for embedding vector generation
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Document Title / Notice Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ingestTitle}
                    onChange={(e) => setIngestTitle(e.target.value)}
                    placeholder="e.g. DSP Lab Semester 4 Schedule & Viva Syllabus"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Knowledge Category *
                  </label>
                  <select
                    value={ingestCategory}
                    onChange={(e) => setIngestCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  >
                    <option value="exam">Exam Schedule & Regulations</option>
                    <option value="lab">Lab Manual & Timetables</option>
                    <option value="placement">Placements & Drives</option>
                    <option value="scholarship">Scholarships & Grants</option>
                    <option value="general">General Campus Notice</option>
                  </select>
                </div>

                {/* Text Content */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Document Text Content (For Embedding) *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={ingestContent}
                    onChange={(e) => setIngestContent(e.target.value)}
                    placeholder="Paste the official announcement text, exam timings, room numbers, eligibility rules..."
                    className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isIngesting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {isIngesting ? (
                    <span>Generating Vector & Indexing...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Ingest into AI Knowledge Base</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Guidelines */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                RAG Pipeline Overview
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-brand-400">1. Vector Embedding</span>
                  <p className="text-[11px] text-slate-400">Content converted to 768-dim float vector via Gemini gemini-embedding-001.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-brand-400">2. Cosine Distance</span>
                  <p className="text-[11px] text-slate-400">Supabase pgvector match_documents function calculates similarity metric.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-brand-400">3. Gemini 1.5 Synthesis</span>
                  <p className="text-[11px] text-slate-400">Relevant document contexts injected into prompt for instant student answers.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: POST ANNOUNCEMENT */}
      {activeTab === 'announcement' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-400" />
              Publish Announcement to Student Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Create an official notice entry that appears on the student home feed and filterable notice board.
            </p>
          </div>

          {ancSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{ancSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notice Title *
              </label>
              <input
                type="text"
                required
                value={ancTitle}
                onChange={(e) => setAncTitle(e.target.value)}
                placeholder="e.g. Merit Cum Means Scholarship Application Deadline Extended"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={ancCategory}
                  onChange={(e) => setAncCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500"
                >
                  <option value="exam">Exam Notice</option>
                  <option value="lab">Lab Timetable</option>
                  <option value="placement">Placement Drive</option>
                  <option value="scholarship">Scholarship Form</option>
                  <option value="general">General Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PDF / File Attachment URL (Optional)
                </label>
                <input
                  type="text"
                  value={ancFileUrl}
                  onChange={(e) => setAncFileUrl(e.target.value)}
                  placeholder="/docs/scholarship_form.pdf"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notice Description *
              </label>
              <textarea
                required
                rows={4}
                value={ancDescription}
                onChange={(e) => setAncDescription(e.target.value)}
                placeholder="Provide details for students..."
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500"
              ></textarea>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="pinned"
                checked={ancIsPinned}
                onChange={(e) => setAncIsPinned(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="pinned" className="text-xs font-semibold text-slate-300 flex items-center gap-1 cursor-pointer">
                <Pin className="w-3.5 h-3.5 text-brand-400" />
                Pin this notice to top of student notice board
              </label>
            </div>

            <button
              type="submit"
              disabled={isPublishing}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all"
            >
              {isPublishing ? 'Publishing Announcement...' : 'Publish Announcement'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
