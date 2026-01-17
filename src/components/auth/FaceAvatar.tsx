import React, { useMemo } from 'react';

export const faceAvatarStyles = `
  .face-avatar {
    width: 236px;
    height: 236px;
    display: block;
    margin: 0 auto;
    filter: drop-shadow(0 22px 32px rgba(15, 23, 42, 0.28));
    transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), filter 0.35s ease;
  }
  .face-avatar .avatar-root {
    transform-origin: 60px 84px;
    animation: avatarFloat 7.4s ease-in-out infinite;
  }
  .face-avatar .ambient-orb {
    opacity: 0.65;
    mix-blend-mode: screen;
    animation: ambientDrift 11s ease-in-out infinite;
  }
  .face-avatar .body-group {
    transform-origin: 60px 100px;
    animation: avatarBreathe 5.6s ease-in-out infinite;
  }
  .face-avatar .head-group {
    transform-origin: 60px 52px;
    animation: headTilt 6.4s ease-in-out infinite;
  }
  .face-avatar .halo {
    opacity: 0.55;
    animation: haloPulse 8.2s ease-in-out infinite;
  }
  .face-avatar .torso {
    fill: #111827;
  }
  .face-avatar .torso-shadow {
    fill: rgba(15, 23, 42, 0.35);
  }
  .face-avatar .collar {
    fill: #ffffff;
  }
  .face-avatar .badge {
    fill: rgba(99, 102, 241, 0.22);
    stroke: #818cf8;
    stroke-width: 0.9;
  }
  .face-avatar .shoulder-left,
  .face-avatar .shoulder-right {
    fill: rgba(15, 23, 42, 0.18);
  }
  .face-avatar .skin {
    fill: #f6d5c4;
  }
  .face-avatar .skin-highlight {
    fill: url(#avatar-skin-highlight);
    opacity: 0.6;
  }
  .face-avatar .chin-shadow {
    fill: rgba(229, 170, 146, 0.4);
    opacity: 0.7;
    animation: chinPulse 7s ease-in-out infinite;
  }
  .face-avatar .ear {
    fill: #f5d2c2;
  }
  .face-avatar .ear-inner {
    fill: rgba(232, 169, 150, 0.45);
  }
  .face-avatar .ear-line {
    stroke: #e4a995;
    stroke-width: 1.4;
    stroke-linecap: round;
  }
  .face-avatar .nose {
    fill: none;
    stroke: rgba(186, 120, 102, 0.9);
    stroke-width: 1.3;
    stroke-linecap: round;
    animation: noseBreath 6.4s ease-in-out infinite;
  }
  .face-avatar .nose-highlight {
    fill: url(#avatar-nose-highlight);
    opacity: 0.7;
  }
  .face-avatar .lip {
    fill: none;
    stroke: #c45974;
    stroke-width: 2.2;
    stroke-linecap: round;
  }
  .face-avatar .lip-highlight {
    fill: rgba(255, 255, 255, 0.55);
    opacity: 0.55;
  }
  .face-avatar .hair {
    fill: url(#avatar-hair-gradient);
  }
  .face-avatar .hair-shadow {
    fill: rgba(17, 24, 39, 0.45);
  }
  .face-avatar .fringe {
    fill: rgba(17, 24, 39, 0.94);
  }
  .face-avatar .cheek {
    fill: #f8b9b0;
    opacity: 0.68;
    animation: cheekPulse 6.8s ease-in-out infinite;
  }
  .face-avatar .eye-group {
    transform-origin: center;
  }
  .face-avatar .eye-white {
    fill: #ffffff;
  }
  .face-avatar .eye {
    fill: #0f172a;
    transform-origin: center;
  }
  .face-avatar .pupil {
    fill: #020617;
    transition: transform 0.4s ease;
  }
  .face-avatar .pupil-highlight {
    fill: rgba(255, 255, 255, 0.75);
  }
  .face-avatar .eye-gloss {
    fill: rgba(255, 255, 255, 0.35);
  }
  .face-avatar .eyelid {
    fill: #f1c7b7;
    opacity: 0;
    transform: translateY(-18px);
    transform-origin: center;
    transition: transform 0.35s ease, opacity 0.35s ease;
  }
  .face-avatar .brow {
    fill: none;
    stroke: #111827;
    stroke-width: 2.8;
    stroke-linecap: round;
    transition: transform 0.32s ease;
  }
  .face-avatar .mouth-smile {
    fill: none;
    stroke: #0f172a;
    stroke-width: 3;
    stroke-linecap: round;
    transition: opacity 0.28s ease;
  }
  .face-avatar .mouth-open {
    fill: none;
    stroke: #0f172a;
    stroke-width: 2.6;
    opacity: 0;
    transition: opacity 0.28s ease;
  }
  .face-avatar .hand {
    fill: #f5d2c2;
    stroke: #eab1a0;
    stroke-width: 1.6;
    transform-origin: 60px 86px;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .face-avatar .hand.shadow {
    fill: rgba(15, 23, 42, 0.18);
    stroke: none;
  }
  .face-avatar .sparkle {
    fill: rgba(255, 255, 255, 0.85);
    animation: sparkleTwinkle 5.8s ease-in-out infinite;
  }
  @keyframes avatarFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes ambientDrift {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(2px, -3px) scale(1.04); }
  }
  @keyframes avatarBreathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  @keyframes headTilt {
    0%, 100% { transform: rotate(-1deg); }
    50% { transform: rotate(1.8deg); }
  }
  @keyframes cheekPulse {
    0%, 100% { opacity: 0.58; }
    50% { opacity: 0.92; }
  }
  @keyframes chinPulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }
  @keyframes haloPulse {
    0%, 100% { opacity: 0.38; }
    50% { opacity: 0.62; }
  }
  @keyframes noseBreath {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(0.6px); }
  }
  @keyframes sparkleTwinkle {
    0%, 100% { opacity: 0.25; transform: scale(0.9); }
    50% { opacity: 0.7; transform: scale(1.1); }
  }
  .face-avatar.idle {}
  .face-avatar.waving {
    transform: translateY(-6px) rotate(-2deg);
  }
  .face-avatar.hiding {
    transform: translateY(-1px) scale(0.99);
  }
  .face-avatar.waving .head-group {
    transform: rotate(-4deg) translateY(-3px);
  }
  .face-avatar.hiding .head-group {
    transform: translateY(2px) rotate(3deg);
    animation-play-state: paused;
  }
  .face-avatar.hiding .eye-group {
    animation: none;
  }
  .face-avatar.waving .pupil {
    transform: translate(2.6px, -1.6px);
  }
  .face-avatar.hiding .pupil {
    transform: translateY(3.6px);
    animation: none;
  }
  .face-avatar.hiding .eyelid {
    opacity: 1;
    transform: translateY(-2px);
    animation: none;
  }
  .face-avatar.hiding .eye-gloss {
    animation: none;
  }
  .face-avatar.waving .brow-left {
    transform: translateY(-2px) rotate(-4deg);
  }
  .face-avatar.waving .brow-right {
    transform: translateY(1px) rotate(6deg);
  }
  .face-avatar.hiding .brow-left {
    transform: translateY(-4px) rotate(8deg);
  }
  .face-avatar.hiding .brow-right {
    transform: translateY(-4px) rotate(-8deg);
  }
  .face-avatar.hiding .mouth-smile {
    opacity: 0;
  }
  .face-avatar.hiding .mouth-open {
    opacity: 1;
  }
  .face-avatar .hand-right {
    transform-origin: 84px 88px;
    animation: handFloatRight 4.4s ease-in-out infinite;
  }
  .face-avatar .hand-left {
    transform-origin: 36px 88px;
    animation: handFloatLeft 4.6s ease-in-out infinite;
  }
  .face-avatar.waving .hand-right {
    animation: waveHand 1.4s ease-in-out infinite;
  }
  .face-avatar.waving .hand-left {
    animation: none;
    transform: translate(-8px, 4px) rotate(6deg);
  }
  .face-avatar.hiding .hand-left,
  .face-avatar.hiding .hand-right {
    animation: none;
  }
  .face-avatar.hiding .hand-left {
    transform: translate(-22px, -26px) rotate(-32deg);
  }
  .face-avatar.hiding .hand-right {
    transform: translate(22px, -26px) rotate(32deg);
  }
  @keyframes waveHand {
    0%, 100% { transform: translate(6px, 6px) rotate(-6deg); }
    40% { transform: translate(-4px, -16px) rotate(-40deg); }
    60% { transform: translate(6px, -6px) rotate(-12deg); }
  }
  @keyframes handFloatRight {
    0%, 100% { transform: translate(6px, 8px) rotate(-6deg); }
    50% { transform: translate(-2px, -2px) rotate(-2deg); }
  }
  @keyframes handFloatLeft {
    0%, 100% { transform: translate(-6px, 8px) rotate(6deg); }
    50% { transform: translate(2px, -1px) rotate(1deg); }
  }
  @media (max-width: 768px) {
    .face-avatar {
      width: 200px;
      height: 200px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .face-avatar,
    .face-avatar .avatar-root,
    .face-avatar .body-group,
    .face-avatar .head-group,
    .face-avatar .cheek,
    .face-avatar .eye-group,
    .face-avatar .eyelid,
    .face-avatar .pupil,
    .face-avatar .eye-gloss,
    .face-avatar .hand,
    .face-avatar .halo,
    .face-avatar .ambient-orb,
    .face-avatar .chin-shadow {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export const FaceAvatar: React.FC<{ mood: string }> = ({ mood }) => {
  const idPrefix = useMemo(() => Math.random().toString(36).slice(2, 9), []);
  const haloId = `${idPrefix}-halo`;
  const hairId = `${idPrefix}-hair`;
  const skinHighlightId = `${idPrefix}-skin`;
  const ambientId = `${idPrefix}-ambient`;
  const noseHighlightId = `${idPrefix}-nose`;

  const state = mood ? mood : 'idle';

  return (
    <svg
      className={`face-avatar ${state}`}
      viewBox="0 0 120 120"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={haloId} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.75" />
          <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={hairId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="65%" stopColor="#111827" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <radialGradient id={skinHighlightId} cx="35%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.46" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ambientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.55" />
          <stop offset="65%" stopColor="#c084fc" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={noseHighlightId} cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="#ffd5ca" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffd5ca" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="avatar-root">
        <circle className="ambient-orb" cx="28" cy="30" r="13" fill={`url(#${ambientId})`} />
        <circle className="ambient-orb" cx="94" cy="20" r="11" fill={`url(#${ambientId})`} />
        <circle className="halo" cx="60" cy="64" r="46" fill={`url(#${haloId})`} />
        <g className="body-group">
          <rect className="torso" x="30" y="78" width="60" height="38" rx="20" />
          <path className="torso-shadow" d="M30 98 C40 104 80 104 90 98 L88 110 Q60 118 32 110 Z" />
          <path className="collar" d="M40 78 Q60 64 80 78 L74 90 Q60 82 46 90 Z" />
          <circle className="badge" cx="60" cy="94" r="6" />
          <path className="shoulder-left" d="M32 94 Q24 100 30 108 Q44 114 52 108 Q46 96 32 94 Z" />
          <path className="shoulder-right" d="M88 94 Q96 100 90 108 Q76 114 68 108 Q74 96 88 94 Z" />
        </g>
        <g className="head-group">
          <ellipse className="ear" cx="28" cy="54" rx="5" ry="8" />
          <ellipse className="ear" cx="92" cy="54" rx="5" ry="8" />
          <ellipse className="ear-inner" cx="28" cy="55" rx="2.6" ry="4.4" />
          <ellipse className="ear-inner" cx="92" cy="55" rx="2.6" ry="4.4" />
          <path className="ear-line" d="M25 55 Q27 56 25 58" />
          <path className="ear-line" d="M95 55 Q93 56 95 58" />
          <circle className="skin" cx="60" cy="52" r="32" />
          <circle className="skin-highlight" cx="52" cy="42" r="22" fill={`url(#${skinHighlightId})`} />
          <path
            className="hair"
            d="M26 52 C26 20 44 8 60 8 C80 8 96 22 96 48 C90 40 80 36 72 34 C60 32 46 36 36 42 C30 46 28 48 26 52 Z"
            fill={`url(#${hairId})`}
          />
          <path
            className="hair-shadow"
            d="M38 30 C50 20 70 20 82 32 C80 24 72 16 60 16 C46 16 34 24 32 40 Z"
          />
          <path className="fringe" d="M36 30 C44 22 56 24 66 24 C74 24 82 28 88 38 C78 34 66 34 54 36 C44 38 38 40 36 30 Z" />
          <ellipse className="cheek" cx="44" cy="62" rx="8.5" ry="5.8" />
          <ellipse className="cheek" cx="76" cy="62" rx="8.5" ry="5.8" />
          <path className="brow brow-left" d="M34 38 Q46 32 54 38" />
          <path className="brow brow-right" d="M66 38 Q74 32 86 38" />
          <path className="nose" d="M58 46 Q60 52 58 58" />
          <path className="nose" d="M62 46 Q60 52 62 58" />
          <ellipse className="nose-highlight" cx="60" cy="52" rx="4.2" ry="6" fill={`url(#${noseHighlightId})`} />
          <g className="eye-group eye-left">
            <ellipse className="eye-white" cx="44" cy="48" rx="9" ry="6" />
            <ellipse className="eye" cx="44" cy="48" rx="5.2" ry="6" />
            <circle className="pupil" cx="44" cy="50" r="2.4" />
            <circle className="pupil-highlight" cx="43.2" cy="49" r="0.9" />
            <ellipse className="eye-gloss" cx="42.5" cy="46.2" rx="2.8" ry="1.2" />
            <ellipse className="eyelid" cx="44" cy="48" rx="9.2" ry="6" />
          </g>
          <g className="eye-group eye-right">
            <ellipse className="eye-white" cx="76" cy="48" rx="9" ry="6" />
            <ellipse className="eye" cx="76" cy="48" rx="5.2" ry="6" />
            <circle className="pupil" cx="76" cy="50" r="2.4" />
            <circle className="pupil-highlight" cx="75.2" cy="49" r="0.9" />
            <ellipse className="eye-gloss" cx="74.5" cy="46.2" rx="2.8" ry="1.2" />
            <ellipse className="eyelid" cx="76" cy="48" rx="9.2" ry="6" />
          </g>
          <path className="mouth-smile" d="M42 68 Q60 78 78 68" />
          <ellipse className="mouth-open" cx="60" cy="69" rx="6" ry="5" />
          <path className="lip" d="M46 66 Q60 72 74 66" />
          <ellipse className="lip-highlight" cx="60" cy="66" rx="7" ry="2" />
          <ellipse className="chin-shadow" cx="60" cy="74" rx="15" ry="7" />
        </g>
        <g>
          <path
            className="hand hand-left"
            d="M26 88 C16 78 20 62 32 58 C44 54 54 62 56 70 C50 74 44 78 40 86 L38 102 Z"
          />
          <path
            className="hand hand-right"
            d="M94 88 C104 78 100 62 88 58 C76 54 66 62 64 70 C70 74 76 78 80 86 L82 102 Z"
          />
          <path className="hand shadow" d="M42 104 Q60 110 78 104 L80 110 Q60 118 40 110 Z" />
        </g>
        <g>
          <circle className="sparkle" cx="28" cy="30" r="1.6" />
          <circle className="sparkle" cx="92" cy="28" r="1.2" />
          <circle className="sparkle" cx="20" cy="70" r="0.9" />
        </g>
      </g>
    </svg>
  );
};

export default FaceAvatar;
