'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import MoodboardWorkspace from '@/components/MoodboardWorkspace';

export default function Home() {
  const [view, setView] = useState<'chat' | 'moodboard'>('chat');

  if (view === 'moodboard') {
    return <MoodboardWorkspace onBack={() => setView('chat')} />;
  }

  return (
    <ChatInterface onStartMoodboard={() => setView('moodboard')} />
  );
}
