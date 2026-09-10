import React from 'react';
import type { IntentType, FragmentItem, ChapterItem } from '../types/archive';

interface IntentProps {
  onSelectIntent: (intent: IntentType) => void;
}

export const Intent: React.FC<IntentProps> = ({ onSelectIntent }) => {
  const options: { label: string; value: IntentType }[] = [
    { label: 'something to feel', value: 'feel' },
    { label: 'something to forget', value: 'forget' },
    { label: 'something loud', value: 'loud' },
    { label: "i don't know", value: 'unknown' }
  ];

  return (
    <section id="intent" className="screen active">
      <div className="intent-inner">
        <div className="intent-q">what are you looking for?</div>
        <div className="intent-opts">
          {options.map((opt) => (
            <button key={opt.value} className="intent-opt" onClick={() => onSelectIntent(opt.value)}>
              <span className="tick">&gt;</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};