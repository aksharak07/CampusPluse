'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatWindow from '@/components/ChatWindow';

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || undefined;

  return <ChatWindow initialQuery={initialQuery} />;
}

export default function ChatPage() {
  return (
    <div className="py-2">
      <Suspense fallback={
        <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
          Loading AI RAG Assistant...
        </div>
      }>
        <ChatContent />
      </Suspense>
    </div>
  );
}
