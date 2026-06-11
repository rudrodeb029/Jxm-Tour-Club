import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

/* ─────────────────────────────────────────
   Animated Illustrations (pure CSS + SVG)
   ───────────────────────────────────────── */

const CrosshairAnimation = () => (
  <div className="ob-anim-wrap">
    {/* Floating particles */}
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="ob-particle"
        style={{
          '--x': `${Math.random() * 100}%`,
          '--y': `${Math.random() * 100}%`,
          '--dur': `${2 + Math.random() * 3}s`,
          '--delay': `${Math.random() * 2}s`,
          '--size': `${3 + Math.random() * 5}px`,
        } as React.CSSProperties}
      />
    ))}

    {/* Outer rings */}
    <div className="ob-ring ob-ring--outer" />
    <div className="ob-ring ob-ring--mid" />

    {/* Crosshair */}
    <svg className="ob-crosshair" viewBox="0 0 200 200" width="160" height="160">
      <circle cx="100" cy="100" r="60" fill="none" stroke="url(#grad1)" strokeWidth="2.5" className="ob-scope-ring" />
      <circle cx="100" cy="100" r="38" fill="none" stroke="url(#grad1)" strokeWidth="1.5" strokeDasharray="6 8" className="ob-scope-inner" />
      <line x1="100" y1="30" x2="100" y2="70" stroke="url(#grad1)" strokeWidth="2" className="ob-scope-line" />
      <line x1="100" y1="130" x2="100" y2="170" stroke="url(#grad1)" strokeWidth="2" className="ob-scope-line" />
      <line x1="30" y1="100" x2="70" y2="100" stroke="url(#grad1)" strokeWidth="2" className="ob-scope-line" />
      <line x1="130" y1="100" x2="170" y2="100" stroke="url(#grad1)" strokeWidth="2" className="ob-scope-line" />
      <circle cx="100" cy="100" r="4" fill="#F96F2E" className="ob-dot-pulse" />
      {/* Corner brackets */}
      <path d="M40 60 L40 40 L60 40" fill="none" stroke="#E34360" strokeWidth="2" />
      <path d="M140 40 L160 40 L160 60" fill="none" stroke="#E34360" strokeWidth="2" />
      <path d="M160 140 L160 160 L140 160" fill="none" stroke="#E34360" strokeWidth="2" />
      <path d="M60 160 L40 160 L40 140" fill="none" stroke="#E34360" strokeWidth="2" />
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F96F2E" />
          <stop offset="100%" stopColor="#E34360" />
        </linearGradient>
      </defs>
    </svg>

    {/* Scan line */}
    <div className="ob-scan-line" />
  </div>
);

const ShieldAnimation = () => (
  <div className="ob-anim-wrap">
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        className="ob-particle ob-particle--blue"
        style={{
          '--x': `${Math.random() * 100}%`,
          '--y': `${Math.random() * 100}%`,
          '--dur': `${2 + Math.random() * 3}s`,
          '--delay': `${Math.random() * 2}s`,
          '--size': `${3 + Math.random() * 4}px`,
        } as React.CSSProperties}
      />
    ))}

    {/* Orbiting dots */}
    <div className="ob-orbit ob-orbit--1"><div className="ob-orbit-dot" /></div>
    <div className="ob-orbit ob-orbit--2"><div className="ob-orbit-dot ob-orbit-dot--pink" /></div>

    <svg className="ob-shield" viewBox="0 0 200 240" width="150" height="180">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F96F2E" />
          <stop offset="100%" stopColor="#E34360" />
        </linearGradient>
        <linearGradient id="shieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(249,111,46,0.15)" />
          <stop offset="100%" stopColor="rgba(227,67,96,0.1)" />
        </linearGradient>
      </defs>
      <path
        d="M100 20 L170 55 L170 120 Q170 180 100 220 Q30 180 30 120 L30 55 Z"
        fill="url(#shieldFill)"
        stroke="url(#shieldGrad)"
        strokeWidth="2.5"
        className="ob-shield-path"
      />
      {/* Inner shield lines */}
      <path
        d="M100 50 L145 72 L145 120 Q145 162 100 190 Q55 162 55 120 L55 72 Z"
        fill="none"
        stroke="url(#shieldGrad)"
        strokeWidth="1"
        strokeDasharray="5 5"
        opacity="0.5"
      />
      {/* Swords / cross */}
      <line x1="80" y1="90" x2="120" y2="150" stroke="#F96F2E" strokeWidth="3" strokeLinecap="round" />
      <line x1="120" y1="90" x2="80" y2="150" stroke="#E34360" strokeWidth="3" strokeLinecap="round" />
      {/* Star */}
      <polygon
        points="100,75 104,87 117,87 107,95 111,107 100,99 89,107 93,95 83,87 96,87"
        fill="#F96F2E"
        className="ob-star-pulse"
      />
    </svg>
  </div>
);

const TrophyAnimation = () => (
  <div className="ob-anim-wrap">
    {/* Confetti particles */}
    {Array.from({ length: 18 }).map((_, i) => (
      <div
        key={i}
        className="ob-confetti"
        style={{
          '--x': `${10 + Math.random() * 80}%`,
          '--dur': `${1.5 + Math.random() * 2}s`,
          '--delay': `${Math.random() * 3}s`,
          '--color': ['#F96F2E', '#E34360', '#FFD700', '#4ADE80', '#60A5FA'][Math.floor(Math.random() * 5)],
          '--rot': `${Math.random() * 360}deg`,
        } as React.CSSProperties}
      />
    ))}

    <div className="ob-trophy-glow" />

    <svg className="ob-trophy" viewBox="0 0 200 220" width="150" height="170">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        <linearGradient id="goldShineDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,215,0,0.3)" />
          <stop offset="100%" stopColor="rgba(255,140,0,0.05)" />
        </linearGradient>
      </defs>
      {/* Cup body */}
      <path
        d="M60 50 L60 30 L140 30 L140 50 Q140 110 100 130 Q60 110 60 50 Z"
        fill="url(#goldShineDark)"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
        className="ob-trophy-body"
      />
      {/* Left handle */}
      <path d="M60 50 Q30 50 30 80 Q30 105 60 100" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" />
      {/* Right handle */}
      <path d="M140 50 Q170 50 170 80 Q170 105 140 100" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" />
      {/* Stem */}
      <rect x="92" y="130" width="16" height="30" rx="3" fill="url(#goldGrad)" opacity="0.8" />
      {/* Base */}
      <rect x="70" y="160" width="60" height="12" rx="6" fill="url(#goldGrad)" opacity="0.7" />
      {/* Star on trophy */}
      <polygon
        points="100,55 106,72 124,72 110,82 115,99 100,89 85,99 90,82 76,72 94,72"
        fill="#FFD700"
        className="ob-star-pulse"
      />
      {/* #1 text */}
      <text x="100" y="120" textAnchor="middle" fill="#FFD700" fontSize="16" fontWeight="800" fontFamily="Outfit">#1</text>
    </svg>

    {/* Rays */}
    <div className="ob-rays" />
  </div>
);

/* ─── Component Map ─── */
const AnimationMap: Record<string, React.FC> = {
  crosshair: CrosshairAnimation,
  shield: ShieldAnimation,
  trophy: TrophyAnimation,
};

/* ─── Main Onboarding ─── */
const Onboarding = () => {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const slides = [
    {
      icon: 'crosshair',
      title: t('obSlide1Title'),
      description: t('obSlide1Desc'),
    },
    {
      icon: 'shield',
      title: t('obSlide2Title'),
      description: t('obSlide2Desc'),
    },
    {
      icon: 'trophy',
      title: t('obSlide3Title'),
      description: t('obSlide3Desc'),
    },
  ];

  const slides = [
    {
      icon: 'crosshair',
      titleKey: 'onboardingSlide1Title',
      descKey: 'onboardingSlide1Desc',
    },
    {
      icon: 'shield',
      titleKey: 'onboardingSlide2Title',
      descKey: 'onboardingSlide2Desc',
    },
    {
      icon: 'trophy',
      titleKey: 'onboardingSlide3Title',
      descKey: 'onboardingSlide3Desc',
    },
  ];

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      localStorage.setItem('hasSeenOnboarding', 'true');
      navigate('/auth');
    }
  };

  const slide = slides[currentSlide];
  const AnimComponent = AnimationMap[slide.icon];

  return (
    <div className="ob-root">
      {/* Styles */}
      <style>{onboardingCSS}</style>

      <button className="ob-skip" onClick={() => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        navigate('/auth');
      }}>{t('skip')}</button>

      <div className="ob-content animate-fade-in" key={animKey}>
        {/* Animation area */}
        <div className="ob-illustration">
          <AnimComponent />
        </div>

        {/* Text + CTA */}
        <div className="ob-text-area">
          {/* Slide dots */}
          <div className="ob-dots">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`ob-dot ${i === currentSlide ? 'ob-dot--active' : ''}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>

          <h2 className="ob-title">{t(slide.titleKey)}</h2>
          <p className="ob-desc">{t(slide.descKey)}</p>

          <button className="ob-cta" onClick={handleNext}>
            {currentSlide === slides.length - 1 ? t('letsStart') : t('next')}
            <span className="ob-cta-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

/* ═══════════════════════════════════════════
   CSS-in-JS (injected via <style>)
   ═══════════════════════════════════════════ */
const onboardingCSS = `
/* ── Layout ── */
.ob-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(165deg, #12141F 0%, #0A0C14 50%, #14101E 100%);
  position: relative;
  overflow: hidden;
  color: #fff;
}

.ob-skip {
  position: absolute;
  top: 20px;
  right: 16px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  z-index: 10;
  padding: 6px 16px;
  border-radius: 20px;
  font-family: 'Outfit', sans-serif;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}
.ob-skip:hover { background: rgba(255,255,255,0.15); color: #fff; }

.ob-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 20px 32px;
}

/* ── Illustration Container ── */
.ob-illustration {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 280px;
}

.ob-anim-wrap {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Particles ── */
.ob-particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: #F96F2E;
  left: var(--x);
  top: var(--y);
  opacity: 0;
  animation: particleFloat var(--dur) var(--delay) ease-in-out infinite;
  box-shadow: 0 0 8px rgba(249, 111, 46, 0.6);
}
.ob-particle--blue {
  background: #60A5FA;
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
}

@keyframes particleFloat {
  0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
  50% { opacity: 0.8; transform: translateY(-20px) scale(1); }
}

/* ── Crosshair Slide ── */
.ob-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(249, 111, 46, 0.15);
}
.ob-ring--outer {
  width: 240px; height: 240px;
  animation: ringPulse 3s ease-in-out infinite;
}
.ob-ring--mid {
  width: 200px; height: 200px;
  border-color: rgba(227, 67, 96, 0.12);
  animation: ringPulse 3s 0.5s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.08); opacity: 0.8; }
}

.ob-crosshair {
  position: relative;
  z-index: 2;
  animation: scopeAppear 0.8s ease-out forwards;
  filter: drop-shadow(0 0 20px rgba(249, 111, 46, 0.3));
}

.ob-scope-ring { animation: scopeSpin 8s linear infinite; transform-origin: 100px 100px; }
.ob-scope-inner { animation: scopeSpin 12s linear infinite reverse; transform-origin: 100px 100px; }

@keyframes scopeSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes scopeAppear { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }

.ob-dot-pulse { animation: dotPulse 1.5s ease-in-out infinite; transform-origin: 100px 100px; }
@keyframes dotPulse {
  0%, 100% { r: 4; opacity: 1; }
  50% { r: 7; opacity: 0.6; }
}

.ob-scan-line {
  position: absolute;
  width: 180px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(249,111,46,0.6), transparent);
  animation: scanMove 2.5s ease-in-out infinite;
  z-index: 1;
}
@keyframes scanMove {
  0%, 100% { transform: translateY(-60px); opacity: 0; }
  50% { transform: translateY(60px); opacity: 1; }
}

/* ── Shield Slide ── */
.ob-shield {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 0 25px rgba(249, 111, 46, 0.25));
  animation: shieldFloat 3s ease-in-out infinite;
}

.ob-shield-path { animation: shieldGlow 2s ease-in-out infinite; }
@keyframes shieldGlow {
  0%, 100% { filter: drop-shadow(0 0 5px rgba(249,111,46,0.3)); }
  50% { filter: drop-shadow(0 0 15px rgba(249,111,46,0.6)); }
}

@keyframes shieldFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.ob-star-pulse { animation: starPulse 2s ease-in-out infinite; }
@keyframes starPulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* Orbits */
.ob-orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed rgba(249, 111, 46, 0.15);
}
.ob-orbit--1 { width: 220px; height: 220px; animation: orbitSpin 6s linear infinite; }
.ob-orbit--2 { width: 250px; height: 250px; animation: orbitSpin 9s linear infinite reverse; }

.ob-orbit-dot {
  position: absolute;
  top: -4px;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #F96F2E;
  box-shadow: 0 0 12px rgba(249, 111, 46, 0.8);
}
.ob-orbit-dot--pink {
  background: #E34360;
  box-shadow: 0 0 12px rgba(227, 67, 96, 0.8);
}

@keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ── Trophy Slide ── */
.ob-trophy {
  position: relative;
  z-index: 2;
  animation: trophyBounce 2s ease-in-out infinite;
  filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.25));
}
@keyframes trophyBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.03); }
}

.ob-trophy-body { animation: trophyShine 3s ease-in-out infinite; }
@keyframes trophyShine {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.ob-trophy-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,215,0,0.15), transparent 70%);
  animation: glowPulse 2s ease-in-out infinite;
  z-index: 0;
}
@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.4); opacity: 1; }
}

.ob-rays {
  position: absolute;
  width: 260px;
  height: 260px;
  background: conic-gradient(
    from 0deg,
    transparent,
    rgba(255, 215, 0, 0.04) 10%,
    transparent 20%,
    rgba(255, 215, 0, 0.04) 30%,
    transparent 40%,
    rgba(255, 215, 0, 0.04) 50%,
    transparent 60%,
    rgba(255, 215, 0, 0.04) 70%,
    transparent 80%,
    rgba(255, 215, 0, 0.04) 90%,
    transparent
  );
  border-radius: 50%;
  animation: raysSpin 15s linear infinite;
  z-index: 0;
}
@keyframes raysSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Confetti */
.ob-confetti {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--color);
  left: var(--x);
  top: 50%;
  border-radius: 1px;
  opacity: 0;
  transform: rotate(var(--rot));
  animation: confettiFall var(--dur) var(--delay) ease-out infinite;
}
@keyframes confettiFall {
  0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
  100% { opacity: 0; transform: translateY(120px) rotate(360deg) scale(0.3); }
}

/* ── Text Area ── */
.ob-text-area {
  padding-bottom: 24px;
}

.ob-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
.ob-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  cursor: pointer;
  transition: all 0.4s ease;
}
.ob-dot--active {
  width: 32px;
  border-radius: 4px;
  background: linear-gradient(90deg, #F96F2E, #E34360);
  box-shadow: 0 0 12px rgba(249, 111, 46, 0.4);
}

.ob-title {
  font-size: 1.8rem;
  font-weight: 700;
  white-space: pre-line;
  line-height: 1.15;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.ob-desc {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.55);
  margin-bottom: 28px;
  line-height: 1.5;
  max-width: 320px;
}

.ob-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #F96F2E 0%, #E34360 100%);
  color: white;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(249, 111, 46, 0.25), 0 2px 8px rgba(227, 67, 96, 0.15);
  position: relative;
  overflow: hidden;
}
.ob-cta::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  animation: ctaShine 3s ease-in-out infinite;
}
@keyframes ctaShine {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}

.ob-cta:active { transform: scale(0.98); }

.ob-cta-arrow {
  font-size: 1.15rem;
  transition: transform 0.3s ease;
}
.ob-cta:hover .ob-cta-arrow { transform: translateX(4px); }
`;
