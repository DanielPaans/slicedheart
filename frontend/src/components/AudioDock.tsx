import React from 'react';

interface AudioDockProps {
  isOpen: boolean;
  title: string;
  sub: string;
  spotifyEmbed: string | null;
  spotifyLink: string;
  onClose: () => void;
}

export const AudioDock: React.FC<AudioDockProps> = ({
  isOpen,
  title,
  sub,
  spotifyEmbed,
  spotifyLink,
  onClose
}) => {
  return (
    <div id="dock" className={isOpen ? 'open' : ''}>
      <div className="dock-meta">
        <b>{title}</b>
        <span>{sub}</span>
      </div>
      <div className="dock-frame-wrap">
        {spotifyEmbed ? (
          <iframe
            src={spotifyEmbed}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
        ) : (
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '14px', color: 'var(--paper-dim)' }}>
            ░ no signal —{' '}
            <a className="listen-link" href={spotifyLink} target="_blank" rel="noopener noreferrer">
              real track on Spotify
            </a>
          </div>
        )}
      </div>
      <button className="dock-close" onClick={onClose}>
        [ close ]
      </button>
    </div>
  );
};