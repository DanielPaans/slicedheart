import React, { useEffect, useState } from 'react';

// Styles & Data
import './App.css';
import { FRAGMENTS, CHAPTER } from './data/fragments';
import type { IntentType, FragmentItem, ChapterItem } from './types/archive';

// Components
import { Gate } from './components/Gate';
import { Intent } from './components/Intent';
import { Archive } from './components/Archive';
import { FragmentReader } from './components/FragmentReader';
import { AudioDock } from './components/AudioDock';

type Screen = 'gate' | 'intent' | 'archive' | 'fragment';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('gate');
  const [currentIntent, setCurrentIntent] = useState<IntentType | null>(null);
  const [visited, setVisited] = useState<Record<string, boolean>>({});

  // Active Reader Item State
  const [selectedItem, setSelectedItem] = useState<FragmentItem | ChapterItem | null>(null);
  const [isChapter, setIsChapter] = useState(false);

  // Dynamic Fragments State (Fetched from Flask API)
  const [fragments, setFragments] = useState<FragmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch fragments from Flask backend
  const fetchFragments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/fragments');
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data: FragmentItem[] = await response.json();
      
      // Fallback to static FRAGMENTS if local database is empty
      setFragments(data.length > 0 ? data : FRAGMENTS);
      setError(null);
    } catch (err) {
      console.error('Failed to load fragments:', err);
      setError('Could not sync with archive server. Using fallback local cache.');
      setFragments(FRAGMENTS); // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFragments();
  }, []);

  // Audio Dock state
  const [dockOpen, setDockOpen] = useState(false);
  const [dockTitle, setDockTitle] = useState('');
  const [dockSub, setDockSub] = useState('');
  const [dockSpotify, setDockSpotify] = useState<string | null>(null);
  const [dockLink, setDockLink] = useState('');

  const handleSelectIntent = (intent: IntentType) => {
    setCurrentIntent(intent);
    setCurrentScreen('archive');
  };

  const openFragment = (id: string) => {
    // Search fetched dynamic fragments list first, fallback to static dataset
    const frag = fragments.find((f) => f.id === id) || FRAGMENTS.find((f) => f.id === id);
    if (!frag) return;

    setVisited((prev) => ({ ...prev, [id]: true }));
    setSelectedItem(frag);
    setIsChapter(false);
    setCurrentScreen('fragment');

    // Update Dock
    setDockTitle(frag.title);
    setDockSub(` fragment_${frag.id}`);
    setDockSpotify(frag.spotify);
    setDockLink(frag.spotifyLink);
    setDockOpen(true);
  };

  const openChapter = () => {
    setVisited((prev) => ({ ...prev, NA: true }));
    setSelectedItem(CHAPTER);
    setIsChapter(true);
    setCurrentScreen('fragment');
  };

  const openDockCustomPart = (partTitle: string) => {
    setDockTitle(partTitle);
    setDockSub(` NEVER AGAIN — ${partTitle}`);
    setDockSpotify(null);
    setDockLink('https://open.spotify.com/artist/5UQfPgBcqFOA5pZxduU04i');
    setDockOpen(true);
  };

  return (
    <div className="app">
      {/* Background visual FX overlay layers */}
      <div id="grain"></div>
      <div id="scan"></div>
      <div id="vignette"></div>

      {/* Sync Status Overlay (Optional minimal info display) */}
      {error && <div className="system-status error-banner">{error}</div>}

      {/* Dynamic Screen Routing */}
      {currentScreen === 'gate' && <Gate onEnter={() => setCurrentScreen('intent')} />}

      {currentScreen === 'intent' && <Intent onSelectIntent={handleSelectIntent} />}

      {currentScreen === 'archive' && (
        <Archive
          fragments={fragments}
          chapter={[CHAPTER]}
          visited={visited}
          currentIntent={currentIntent}
          onOpenFragment={openFragment}
          onOpenChapter={openChapter}
        />
      )}

      {currentScreen === 'fragment' && selectedItem && (
        <FragmentReader
          item={selectedItem}
          isChapter={isChapter}
          onBack={() => setCurrentScreen('archive')}
          onPlayPart={openDockCustomPart}
        />
      )}

      {/* Global Audio Dock */}
      <AudioDock
        isOpen={dockOpen}
        title={dockTitle}
        sub={dockSub}
        spotifyEmbed={dockSpotify}
        spotifyLink={dockLink}
        onClose={() => setDockOpen(false)}
      />
    </div>
  );
};

export default App;