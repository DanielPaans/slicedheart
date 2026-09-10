import React, { useState } from 'react';
import type { IntentType, FragmentItem, ChapterItem } from '../types/archive';

interface ArchiveProps {
  fragments: FragmentItem[];
  chapter: ChapterItem[];
  visited: Record<string, boolean>;
  currentIntent: IntentType | null;
  onOpenFragment: (id: string) => void;
  onOpenChapter: () => void;
}

export const Archive: React.FC<ArchiveProps> = ({
  fragments,
  visited,
  currentIntent,
  onOpenFragment,
  onOpenChapter
}) => {
  const [shakingId, setShakingId] = useState<string | null>(null);

  const intentMsgs: Record<IntentType, string> = {
    feel: 'you wanted something to feel. the archive left a light on for you.',
    forget: 'you wanted something to forget. it left the door unlocked instead.',
    loud: "you wanted something loud. it's not sorry about the neighbours.",
    unknown: "you didn't know. neither did it, when it made this."
  };

  const getBar = (count: number, max: number) => {
    const filledCount = Math.min(Math.round((count / max) * 10), 10);
    const filled = '█'.repeat(filledCount);
    const empty = '░'.repeat(10 - filledCount);
    return (
      <>
        {filled}
        <span className="empty">{empty}</span>
      </>
    );
  };

  const visitedCount = Object.keys(visited).length;

  const triggerShake = (id: string) => {
    setShakingId(id);
    setTimeout(() => setShakingId(null), 300);
  };

  return (
    <section id="archive" className="screen active">
      <div className="archive-scroll">
        <div className="archive-wrap">
          <div className="topbar">
            <div className="brandmark">
              slicedheart<span className="cut">.</span>
            </div>
            <div className="intent-echo">{currentIntent ? intentMsgs[currentIntent] : ''}</div>
          </div>

          <div className="status-panel">
            <div className="status-title">HEART STATUS</div>
            <div className="status-row">
              <span className="status-label">memories</span>
              <span className="status-bar">{getBar(1 + (visited['NA'] ? 1 : 0), 4)}</span>
            </div>
            <div className="status-row">
              <span className="status-label">songs</span>
              <span className="status-bar">{getBar(4 + Math.min(visitedCount, 3), 7)}</span>
            </div>
            <div className="status-row">
              <span className="status-label">thoughts</span>
              <span className="status-bar">{getBar(1 + (visited['031'] ? 1 : 0), 3)}</span>
            </div>
            <div className="status-row">
              <span className="status-label">???</span>
              <span className="status-bar">{getBar(Math.min(visitedCount, 9), 9)}</span>
            </div>
          </div>

          <div className="section-label">fragments</div>
          <div className="frag-grid">

            {/* Fragments */}
            {fragments.map((fragment, index) => {
              const isAlbum = fragment.type === 'ALBUM';
              const isEP = fragment.type === 'EP';
              
              const hasBackground = Boolean(fragment.coverArt && (isAlbum || isEP || fragment.integrity > 80));
              const isGlitchy = fragment.integrity < 75;

              const rotation = `${((index % 5) - 2) * 0.5}deg`;
              const shakeDelay = `${-((index * 1.3) % 4).toFixed(1)}s`;
              const shakeDuration = `${(3.6 + (index % 3) * 0.4).toFixed(1)}s`;

              return (
                <button
                  key={fragment.id}
                  className={`frag-card 
                    ${isAlbum ? 'album' : ''} 
                    ${isEP ? 'ep' : ''} 
                    ${isGlitchy ? 'frag-glitch' : ''} 
                    ${visited[fragment.id] ? 'visited' : ''}`}
                  onClick={() => onOpenFragment(fragment.id)}
                  style={{
                    '--r': rotation,
                    '--shake-delay': shakeDelay,
                    '--shake-duration': shakeDuration
                  } as React.CSSProperties}
                >
                {/* Background Image - Only rendered if condition matches */}
                {hasBackground && (
                  <div
                    className="frag-card-bg"
                    style={{ backgroundImage: `url(${fragment.coverArt})` }}
                  />
                )}

                {isAlbum && <span className="album-badge">FULL ALBUM</span> || isEP && <span className="album-badge">FULL EP</span>}

                <div className="frag-content" data-text={fragment.title}>
                  <div className="frag-code">
                    fragment_{fragment.code || fragment.id} · {isAlbum ? 'album' : 'track'}
                  </div>

                  <div className="frag-title" data-title={fragment.title}>{fragment.title}</div>
                  <div className="frag-meta">
                    <span>{fragment.recovered}</span>
                    <span className="ei">EI {fragment.integrity}%</span>
                  </div>
                </div>

                </button>
              );
            })}

            {/* Locked item */}
            <button
              className={`frag-card locked ${shakingId === '???' ? 'shake' : ''}`}
              onClick={() => triggerShake('???')}
              style={{ '--r': '-0.5deg' } as React.CSSProperties}
            >
              <div className="frag-code">fragment_???</div>
              <div className="frag-title">???</div>
              <div className="frag-tag">not recovered yet</div>
              <div className="frag-meta">
                <span>??:??</span>
                <span className="ei">EI --%</span>
              </div>
            </button>
          </div>

          <div className="about-block">
            this is a fan-built archive imagining the world of <strong>slicedheart</strong> — a real, small, independent artist. one track, <em>idontKNOW!!!</em>, plays here straight from their official Spotify catalog. everything else — the case notes, the margin scrawl, the emotional integrity percentages — is atmosphere, not fact. it's not affiliated with the artist.
            <br />
            hear the real discography →{' '}
            <a href="https://open.spotify.com/artist/5UQfPgBcqFOA5pZxduU04i" target="_blank" rel="noopener noreferrer">
              open.spotify.com/artist/slicedheart
            </a>
            <div className="scribble">the archive keeps growing. so does he.</div>
          </div>
        </div>
      </div>
    </section>
  );
};