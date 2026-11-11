'use client';

import React from 'react';
import { Announcement, CategoryType } from '@/types';
import { 
  FileText, 
  Calendar, 
  User, 
  Pin, 
  Download, 
  Eye, 
  Sparkles,
  BookOpen,
  Award,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPreviewPDF: (anc: Announcement) => void;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  exam: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    icon: AlertCircle,
  },
  lab: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: BookOpen,
  },
  placement: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: Briefcase,
  },
  scholarship: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    icon: Award,
  },
  general: {
    bg: 'bg-brand-500/10',
    text: 'text-brand-400',
    border: 'border-brand-500/30',
    icon: Sparkles,
  },
};

export default function AnnouncementCard({
  announcement,
  onPreviewPDF,
}: AnnouncementCardProps) {
  const style = CATEGORY_STYLES[announcement.category] || CATEGORY_STYLES.general;
  const CategoryIcon = style.icon;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={`group relative rounded-xl bg-slate-900/80 border transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-0.5 ${
        announcement.is_pinned
          ? 'border-brand-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950/30'
          : 'border-slate-800/80 hover:border-slate-700'
      } p-5 flex flex-col justify-between`}
    >
      {/* Pinned Tag */}
      {announcement.is_pinned && (
        <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center shadow-md shadow-brand-500/30">
          <Pin className="w-3 h-3 mr-1 fill-white" />
          PINNED NOTICE
        </div>
      )}

      <div>
        {/* Category Badge & Date */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}
          >
            <CategoryIcon className="w-3.5 h-3.5 mr-1.5" />
            {announcement.category}
          </span>
          <span className="text-xs text-slate-400 flex items-center font-mono">
            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
            {formatDate(announcement.date)}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors leading-snug mb-2">
          {announcement.title}
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-3">
          {announcement.description}
        </p>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between mt-2">
        <div className="flex items-center text-xs text-slate-400">
          <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span>{announcement.author || 'Academic Office'}</span>
        </div>

        {/* PDF Attachment Actions */}
        {announcement.file_url ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPreviewPDF(announcement)}
              className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              title="Preview attachment text"
            >
              <Eye className="w-3.5 h-3.5 mr-1 text-brand-400" />
              View PDF
            </button>
            <a
              href={announcement.file_url}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center p-1.5 rounded-md bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 transition-colors"
              title="Download notice PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono">Text Announcement</span>
        )}
      </div>
    </div>
  );
}
