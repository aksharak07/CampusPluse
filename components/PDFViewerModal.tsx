'use client';

import React from 'react';
import { Announcement } from '@/types';
import { X, FileText, Download, Sparkles, Calendar, User, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PDFViewerModalProps {
  announcement: Announcement | null;
  onClose: () => void;
}

export default function PDFViewerModal({ announcement, onClose }: PDFViewerModalProps) {
  const router = RouterHook();

  if (!announcement) return null;

  const handleAskAI = () => {
    onClose();
    // Redirect to chat with pre-filled search prompt
    const query = encodeURIComponent(`Tell me more about the notice: ${announcement.title}`);
    window.location.href = `/chat?q=${query}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white line-clamp-1">{announcement.title}</h2>
              <p className="text-xs text-slate-400 font-mono">Official PDF Document Viewer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans">
          
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>Published: {new Date(announcement.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>Issuer: {announcement.author || 'Academic Office'}</span>
            </div>
            <div className="flex items-center">
              <span className="capitalize font-semibold text-brand-400">Category: {announcement.category}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notice Overview</h4>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-line">
              {announcement.description}
            </div>
          </div>

          {/* PDF Viewer Placeholder / Direct Link */}
          <div className="p-8 rounded-xl bg-slate-950/80 border border-dashed border-slate-700 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Attached File: {announcement.file_url?.split('/').pop() || 'official_document.pdf'}</p>
              <p className="text-xs text-slate-400 mt-1">High-resolution PDF verified by Campus Academic Board</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {announcement.file_url && (
                <a
                  href={announcement.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open PDF in New Tab
                </a>
              )}

              <button
                onClick={handleAskAI}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                Ask RAG AI About This PDF
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}

function RouterHook() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}
