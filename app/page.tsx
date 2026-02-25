'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import MoodboardWorkspace from '@/components/MoodboardWorkspace';
import { usePersistedTotalCost } from '@/lib/use-persisted-total-cost';

export default function Home() {
  const [view, setView] = useState<'chat' | 'moodboard'>('chat');
  const { total, addCost } = usePersistedTotalCost();

  if (view === 'moodboard') {
    return (
      <MoodboardWorkspace
        onBack={() => setView('chat')}
        totalCost={total}
        onAddCost={addCost}
      />
    );
  }

  return (
    <ChatInterface
      onStartMoodboard={() => setView('moodboard')}
      totalCost={total}
      onAddCost={addCost}
    />
  );
}
