'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  BookOpen, 
  Award, 
  Briefcase, 
  Calendar, 
  Bell, 
  ShieldCheck, 
  Zap, 
  FileText,
  Pin,
  ChevronRight
} from 'lucide-react';
import { Announcement } from '@/types';
import AnnouncementCard from '@/components/AnnouncementCard';
import PDFViewerModal from '@/components/PDFViewerModal';

export default function StudentLandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [selectedPDFNotice, setSelectedPDFNotice] = useState<Announcement | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setRecentAnnouncements((data.announcements || []).slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load recent notices:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/chat?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categoryCards = [
    {
      title: 'Exam Schedules',
      category: 'exam',
      description: 'Mid-term, end-term datesheets & venue seating matrices',
      icon: Calendar,
      color: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30',
      btnText: 'Ask Exam AI',
      query: 'What are the upcoming mid-semester exam dates?',
    },
    {
      title: 'Lab Timetables',
      category: 'lab',
      description: 'DSP, Microprocessor & VLSI lab batch slots & practical rules',
      icon: BookOpen,
      color: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
      btnText: 'View Lab Schedule',
      query: 'When is the DSP lab exam for Semester 4?',
    },
    {
      title: 'Placements Drive',
      category: 'placement',
      description: 'TCS, Infosys & Accenture campus drive eligibility & compensation',
      icon: Briefcase,
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
      btnText: 'Check Placements',
      query: 'What are the placement drive criteria for TCS Digital?',
    },
    {
      title: 'Scholarships Hub',
      category: 'scholarship',
      description: 'Merit Cum Means (MCM) & state tuition grant application forms',
      icon: Award,
      color: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30',
      btnText: 'Explore Grants',
      query: 'What are the eligibility criteria for the MCM scholarship?',
    },
  ];

  return (
    <div className="space-y-12 pb-12">
      
      {/* Hero Banner with Search */}
      <section className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/15 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-accent-purple/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span>AI-Powered RAG Student Intelligence Center</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Stop searching fragmented PDFs.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-accent-pink">
              Ask campuspluse+ AI.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-sans max-w-2xl mx-auto">
            Instant, verified answers for exam timetables, DSP lab batches, MCM scholarships, and placement eligibility powered by <strong>Gemini 1.5 Flash</strong>.
          </p>

          {/* Quick RAG AI Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center shadow-2xl">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask e.g. 'When is the DSP lab exam?' or 'MCM Scholarship CGPA rule'..."
                className="w-full pl-12 pr-32 py-4 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 transition-all shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Suggestion tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-500">Popular:</span>
            <button
              onClick={() => router.push('/chat?q=DSP%20Lab%20Exam')}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              DSP Lab Schedule
            </button>
            <button
              onClick={() => router.push('/chat?q=Merit%20Scholarship')}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Scholarship Income Limit
            </button>
            <button
              onClick={() => router.push('/chat?q=TCS%20Placement')}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              TCS Package Details
            </button>
          </div>

        </div>
      </section>

      {/* Category Quick Access Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-400" />
              Core Academic Categories
            </h2>
            <p className="text-xs text-slate-400">Direct query shortcuts grounded in verified campus vector storage</p>
          </div>
          <Link
            href="/announcements"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>View All Notices</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl bg-gradient-to-b ${card.color} border p-6 flex flex-col justify-between hover:scale-[1.02] transition-all duration-200 shadow-lg`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-6">{card.description}</p>
                </div>

                <button
                  onClick={() => router.push(`/chat?q=${encodeURIComponent(card.query)}`)}
                  className="w-full py-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-950 text-white text-xs font-semibold border border-slate-800 flex items-center justify-center space-x-2 transition-colors"
                >
                  <span>{card.btnText}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Announcements Ticker */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Latest Campus Notices</h2>
              <p className="text-xs text-slate-400">Official announcements published by college administration</p>
            </div>
          </div>

          <Link
            href="/announcements"
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 transition-colors"
          >
            Explore Notice Board →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentAnnouncements.map((anc) => (
            <AnnouncementCard
              key={anc.id}
              announcement={anc}
              onPreviewPDF={(notice) => setSelectedPDFNotice(notice)}
            />
          ))}
        </div>
      </section>

      {/* PDF Viewer Modal */}
      {selectedPDFNotice && (
        <PDFViewerModal
          announcement={selectedPDFNotice}
          onClose={() => setSelectedPDFNotice(null)}
        />
      )}

    </div>
  );
}
