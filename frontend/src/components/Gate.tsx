import React, { useState, useEffect } from 'react';

interface GateProps {
  onEnter: () => void;
}

export const Gate: React.FC<GateProps> = ({ onEnter }) => {
  const [glitchText, setGlitchText] = useState('sliced');
  const [dodgeCount, setDodgeCount] = useState(0);
  const [btnText, setBtnText] = useState('[ no ]');
  const [btnPos, setBtnPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const chars = '#%&/\\_-░▓|+~';
    const original = 'sliced';
    
    const interval = setInterval(() => {
      let iterations = 0;
      const glitchIv = setInterval(() => {
        setGlitchText(
          original
            .split('')
            .map((c, i) => (i < iterations ? original[i] : chars[Math.floor(Math.random() * chars.length)]))
            .join('')
        );
        iterations += 1 / 2;
        if (iterations >= original.length) {
          setGlitchText(original);
          clearInterval(glitchIv);
        }
      }, 55);
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const handleMouseEnterNo = () => {
    if (window.matchMedia('(hover: none)').matches) return;

    const nextCount = dodgeCount + 1;
    setDodgeCount(nextCount);

    if (nextCount >= 4) {
      setBtnText('[ fine. yes. ]');
      setBtnPos({ x: 0, y: 0 });
    } else {
      const maxX = 180;
      const maxY = 40;
      const x = Math.random() * maxX - maxX / 2;
      const y = Math.random() * maxY - maxY / 2;
      setBtnPos({ x, y });
    }
  };

  const handleClickNo = () => {
    if (dodgeCount >= 4 || window.matchMedia('(hover: none)').matches) {
      if (window.matchMedia('(hover: none)').matches) {
        setBtnText("it doesn't really let you leave");
        setTimeout(onEnter, 900);
      } else {
        onEnter();
      }
    }
  };

  return (
    <section id="gate" className="screen active">
      <div className="gate-inner">
        <div className="ekg-wrap">
          <svg viewBox="0 0 300 70" preserveAspectRatio="none">
            <path className="ekg-path" d="M0,35 L40,35 L55,10 L70,60 L85,35 L110,35 L120,20 L135,50 L150,35 L300,35" />
          </svg>
        </div>
        <div className="gate-title">
          ur heart has been <span className="glitchword">{glitchText}</span>.
        </div>
        <div className="gate-sub">
          ENTER<span className="blink">?</span>
        </div>
        <div className="gate-btns">
          <button className="btn-enter" onClick={onEnter}>
            [ yes ]
          </button>
          <button
            className="btn-no"
            style={{ transform: `translate(${btnPos.x}px, ${btnPos.y}px)` }}
            onMouseEnter={handleMouseEnterNo}
            onClick={handleClickNo}
          >
            {btnText}
          </button>
        </div>
        <div className="gate-footnote">an unofficial archive · headphones recommended · vol. low</div>
      </div>
    </section>
  );
};