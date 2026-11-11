import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'campuspluse+ - AI Student Information Hub',
  description:
    'Unified, AI-powered central portal for college activities, exam timetables, lab schedules, placements, and scholarship details.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-brand-500 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
            <p>campuspluse+ AI Student Hub • Built with Next.js 14, Supabase pgvector & Google Gemini 1.5 Flash</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

