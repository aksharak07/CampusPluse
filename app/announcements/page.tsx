'use client';

import React, { useState, useEffect } from 'react';
import { Announcement, CategoryType } from '@/types';
import AnnouncementCard from '@/components/AnnouncementCard';
import PDFViewerModal from '@/components/PDFViewerModal';
import { 
  Bell, 
  Search, 
  Filter, 
  Calendar, 
  BookOpen, 
  Award, 
  Briefcase, 
  Sparkles, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const CATEGORIES: { id: CategoryType; label: string; icon: any }[] = [
  { id: 'all', label: 'All Notices', icon: Bell },
  { id: 'exam', label: 'Exams', icon: AlertCircle },
  { id: 'lab', label: 'Lab Schedule', icon: BookOpen },
  { id: 'placement', label: 'Placements', icon: Briefcase },
  { id: 'scholarship', label: 'Scholarships', icon: Award },
  { id: 'general', label: 'General', icon: Sparkles },
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPDFNotice, setSelectedPDFNotice] = useState<Announcement | null>(null);

  useEffect(() => {
    fetchAnnouncements(selectedCategory);
  }, [selectedCategory]);

  const fetchAnnouncements = async (category: CategoryType) => {
    setIsLoading(true);
    try {
      const url = category === 'all' 
        ? '/api/announcements' 
        : `/api/announcements?category=${category}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error('Error fetching notice board:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter((anc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      anc.title.toLowerCase().includes(q) ||
      anc.description.toLowerCase().includes(q) ||
      anc.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950/40 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white">Central Notice & Resource Board</h1>
          </div>
          <p className="text-xs text-slate-400">
            Verified academic circulars, timetable PDFs, lab manuals, and scholarship notices.
          </p>
        </div>

        <button
          onClick={() => fetchAnnouncements(selectedCategory)}
          className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Notices
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                  active
                    ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/20'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices by keyword..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

      </div>

      {/* Notice Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 rounded-xl bg-slate-900/60 border border-slate-800/80 animate-pulse p-6"></div>
          ))}
        </div>
      ) : filteredAnnouncements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnouncements.map((anc) => (
            <AnnouncementCard
              key={anc.id}
              announcement={anc}
              onPreviewPDF={(notice) => setSelectedPDFNotice(notice)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No notices found</h3>
          <p className="text-xs text-slate-400">
            No active announcements matching category "{selectedCategory}" and search query "{searchQuery}".
          </p>
        </div>
      )}

      {/* PDF Modal */}
      {selectedPDFNotice && (
        <PDFViewerModal
          announcement={selectedPDFNotice}
          onClose={() => setSelectedPDFNotice(null)}
        />
      )}

    </div>
  );
}
