import React from 'react';
import type { IntentType, FragmentItem, ChapterItem } from '../types/archive';

interface FragmentReaderProps {
  item: FragmentItem | ChapterItem | null;
  isChapter?: boolean;
  onBack: () => void;
  onPlayPart?: (partTitle: string) => void;
}

export const FragmentReader: React.FC<FragmentReaderProps> = ({
  item,
  isChapter = false,
  onBack,
  onPlayPart
}) => {
  if (!item) return null;

  const renderHeartSvg = () => (
    <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 82 C 10 55, 2 30, 22 15 C 36 4, 48 12, 50 24 C 52 12, 64 4, 78 15 C 98 30, 90 55, 50 82 Z"
        fill="none"
        stroke="#c92a2a"
        strokeWidth="2.4"
        strokeDasharray="4 3"
      />
      <path d="M50 20 L45 40 L55 45 L42 68" fill="none" stroke="#e8e0cc" strokeWidth="1.6" opacity="0.7" />
    </svg>
  );

  if (isChapter) {
    const chap = item as ChapterItem;
    return (
      <section id="fragment" className="screen active">
        <div className="frag-scroll">
          <div className="frag-wrap">
            <button className="frag-close" onClick={onBack}>
              &larr; back to the archive
            </button>
            <div className="art-slot">
              <div className="art-heart">{renderHeartSvg()}</div>
            </div>
            <div className="frag-headline">{chap.title}</div>
            <div className="frag-sub">{chap.tag}</div>
            <div className="chapter-parts">
              {chap.parts.map((p, i) => (
                <div key={i} className="chapter-part" onClick={() => onPlayPart?.(p.t)}>
                  <div>
                    <div className="pt-title">{p.t}</div>
                    <div>{p.d}</div>
                  </div>
                  <span>open &rarr;</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const frag = item as FragmentItem;
  
  // Calculate integrity loss & glitch conditions
  const integrity = frag.integrity ?? 100;
  const isGlitchy = integrity < 75;
  const distortionAmount = Math.max(0, (100 - integrity) / 100); // 0.0 (high integrity) to 1.0 (corrupted)
  const showCoverArt = Boolean(frag.coverArt && integrity >= 50);

  const isAlbumOrEP = frag.type === 'ALBUM' || frag.type === 'EP';
  const playerHeight = isAlbumOrEP ? "380" : "152";

  return (
    <section id="fragment" className={`screen active ${isGlitchy ? 'reader-glitch-active' : ''}`}>
      <div className="frag-scroll">
        <div className="frag-wrap">
          <button className="frag-close" onClick={onBack}>
            &larr; back to the archive
          </button>
          
          {/* Artwork Slot with Integrity-Based Image & Filters */}
          <div className={`art-slot ${isGlitchy ? 'art-slot--glitch' : ''}`}>
            {showCoverArt ? (
              <div 
                className="art-cover-wrap"
                style={{
                  filter: isGlitchy 
                    ? `grayscale(${distortionAmount * 70}%) contrast(${100 + distortionAmount * 120}%) hue-rotate(${distortionAmount * 180}deg)`
                    : 'none'
                }}
              >
                <img 
                  src={frag.coverArt!} 
                  alt={frag.title} 
                  className={`art-cover-image ${isGlitchy ? 'glitch-image-shake' : ''}`}
                />
              </div>
            ) : (
              <div className="art-heart">{renderHeartSvg()}</div>
            )}
            <div className="art-code-overlay">
              fragment_{frag.code || frag.id} · recovered {frag.recovered}
            </div>
          </div>

          {/* Glitching Title text bounded strictly to inline length */}
          <div className="frag-title-container">
            <div 
              className={`frag-headline ${isGlitchy ? 'frag-glitch' : ''}`}
            >
              <span className="frag-title" data-title={frag.title}>
                {frag.title}
              </span>
            </div>
          </div>

          <div className="frag-sub">{frag.tag}</div>
          
          <div className="integrity-row">
            emotional integrity{' '}
            <div className="integrity-track">
              <div 
                className={`integrity-fill ${integrity < 50 ? 'integrity-critical' : ''}`} 
                style={{ width: `${integrity}%` }}
              ></div>
            </div>{' '}
            {integrity}%
          </div>

          <div className="player-shell">
            {frag.spotify ? (
              <iframe
                style={{ borderRadius: '2px' }}
                src={frag.spotify}
                width="100%"
                height={playerHeight}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
            ) : (
              <div className="no-signal">
                ░ NO SIGNAL ░
                <span className="stat">
                  this fragment didn't survive playback. it's real — it just isn't archived here.
                </span>
                <a className="listen-link" href={frag.spotifyLink} target="_blank" rel="noopener noreferrer">
                  hear the real thing on Spotify &rarr;
                </a>
              </div>
            )}
          </div>
          <div className="case-note">{frag.note}</div>
          <div className="margin-scrawl">"{frag.scrawl}"</div>
        </div>
      </div>
    </section>
  );
};