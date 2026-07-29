import React from 'react';

const SUIT_INFO: Record<string, { sym: string; color: string; light: string }> = {
  spades: { sym: '♠', color: '#1a1a2e', light: '#3a3a5e' },
  hearts: { sym: '♥', color: '#d90429', light: '#ff4d6d' },
  diamonds: { sym: '♦', color: '#d90429', light: '#ff4d6d' },
  clubs: { sym: '♣', color: '#1a1a2e', light: '#3a3a5e' },
  joker: { sym: '★', color: '#c9a84c', light: '#e9c46a' },
};

const RANK: Record<number, string> = { 1:'A',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K',14:'A',15:'2',16:'小',17:'大' };

interface CardFaceProps {
  suit: string;
  rank: number;
  size?: number;
  faceDown?: boolean;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

const CardBack: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h} viewBox="0 0 90 126">
    <defs>
      <linearGradient id="cbg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0d1f3d"/>
        <stop offset="100%" stopColor="#162d56"/>
      </linearGradient>
      <pattern id="cbp" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#162d56"/>
        <circle cx="7" cy="7" r="3" fill="#1e3d6e"/>
        <line x1="0" y1="7" x2="14" y2="7" stroke="#c9a84c" strokeWidth="0.3" opacity="0.3"/>
        <line x1="7" y1="0" x2="7" y2="14" stroke="#c9a84c" strokeWidth="0.3" opacity="0.3"/>
      </pattern>
    </defs>
    <rect x="1" y="1" width="88" height="124" rx="8" fill="url(#cbg)" stroke="#1a1a2e" strokeWidth="1"/>
    <rect x="3" y="3" width="84" height="120" rx="7" fill="url(#cbp)"/>
    <rect x="8" y="8" width="74" height="110" rx="4" fill="none" stroke="#c9a84c" strokeWidth="1.5" opacity="0.6"/>
    <rect x="12" y="12" width="66" height="102" rx="3" fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.3"/>
    <circle cx="45" cy="63" r="20" fill="none" stroke="#c9a84c" strokeWidth="1" opacity="0.5"/>
    <text x="45" y="69" textAnchor="middle" fontSize="22" fill="#c9a84c" opacity="0.7" fontFamily="serif">♠</text>
  </svg>
);

export const CardFace: React.FC<CardFaceProps> = ({ suit, rank, size = 80, faceDown, onClick, selected, small }) => {
  const s = small ? size * 0.65 : size;
  const h = s * 1.4;
  const cx = s / 2;
  const cy = h / 2;
  const info = SUIT_INFO[suit] || SUIT_INFO.spades;
  const label = RANK[rank] || String(rank);
  const isJoker = suit === 'joker' || rank >= 16;
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const isFace = rank === 11 || rank === 12 || rank === 13;

  if (faceDown) return <CardBack w={s} h={h} />;

  const shadowFilter = selected
    ? 'drop-shadow(0 0 12px #ffd700) brightness(1.15)'
    : 'drop-shadow(1px 3px 4px rgba(0,0,0,0.5))';

  return (
    <svg width={s} height={h} viewBox="0 0 90 126" onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', filter: shadowFilter, transition: 'transform 0.15s, filter 0.15s' }}>
      <defs>
        <filter id="cardEmboss">
          <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.3"/>
        </filter>
      </defs>
      {/* Card body */}
      <rect x="1" y="1" width="88" height="124" rx="8" fill="#f8f6f0" stroke="#b8a88a" strokeWidth="1.5"/>
      <rect x="4" y="4" width="82" height="118" rx="6" fill="#fdfcf8" stroke="#d4c9b5" strokeWidth="0.5"/>

      {isJoker ? (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize={30} fontWeight="bold" fill={rank === 17 ? '#d90429' : '#1a1a2e'} fontFamily="serif">
            {rank === 17 ? '大' : '小'}
          </text>
          <text x={cx} y={cy + 24} textAnchor="middle" fontSize={26} fill={info.color} fontFamily="serif">JOKER</text>
          <text x={cx} y={cy + 48} textAnchor="middle" fontSize={16} fill={info.color} opacity="0.6">🃏</text>
          {/* Decorative corner */}
          <text x="10" y="20" fontSize="11" fontWeight="bold" fill={info.color}>{label}</text>
          <text x="10" y="33" fontSize="13" fill={info.color} opacity="0.5">★</text>
          <text x="80" y="106" fontSize="11" fontWeight="bold" fill={info.color} textAnchor="end">{label}</text>
          <text x="80" y="119" fontSize="13" fill={info.color} opacity="0.5" textAnchor="end">★</text>
        </>
      ) : isFace ? (
        <>
          {/* Face card design */}
          <rect x="12" y="18" width="66" height="90" rx="6" fill={isRed ? '#fff5f5' : '#f5f6fa'} stroke={info.color} strokeWidth="0.5" opacity="0.3"/>
          {/* Crown for K, Q, J */}
          <text x={cx} y={cy - 14} textAnchor="middle" fontSize={isRed ? 42 : 44} fill={info.color}
            fontFamily="serif" fontWeight="bold">
            {label}
          </text>
          <text x={cx} y={cy + 18} textAnchor="middle" fontSize={38} fill={info.color} fontFamily="serif">
            {rank === 13 ? '♔' : rank === 12 ? '♕' : '♖'}
          </text>
          {/* Decorative border */}
          <rect x="14" y="20" width="62" height="86" rx="5" fill="none" stroke={info.color} strokeWidth="1" opacity="0.2"/>
          <rect x="16" y="22" width="58" height="82" rx="4" fill="none" stroke={info.color} strokeWidth="0.5" opacity="0.15"/>
          {/* Corner pips */}
          <text x="10" y="20" fontSize="11" fontWeight="bold" fill={info.color}>{label}</text>
          <text x="10" y="34" fontSize="14" fill={info.color}>{info.sym}</text>
          <text x="80" y="108" fontSize="11" fontWeight="bold" fill={info.color} textAnchor="end">{label}</text>
          <text x="80" y="122" fontSize="14" fill={info.color} textAnchor="end">{info.sym}</text>
        </>
      ) : (
        <>
          {/* Standard pip card */}
          {/* Top-left corner */}
          <text x="10" y="21" fontSize="13" fontWeight="bold" fill={info.color} fontFamily="sans-serif">{label}</text>
          <text x="10" y="37" fontSize="15" fill={info.color}>{info.sym}</text>
          {/* Bottom-right corner (inverted) */}
          <text x="80" y="108" fontSize="13" fontWeight="bold" fill={info.color} fontFamily="sans-serif" textAnchor="end">{label}</text>
          <text x="80" y="124" fontSize="15" fill={info.color} textAnchor="end">{info.sym}</text>

          {/* Center pip arrangement based on rank */}
          {renderPips(rank, info.sym, info.color, cx, cy)}
        </>
      )}
    </svg>
  );
};

function renderPips(rank: number, sym: string, color: string, cx: number, cy: number) {
  const pips: { x: number; y: number; s: number }[] = [];
  const f = 15;
  const o = 24;
  const twoOff = 22;

  const add = (x: number, y: number) => pips.push({ x: cx + x, y: cy + y, s: f });

  switch (rank) {
    case 1: add(0, 0); break;
    case 2: add(0, -twoOff); add(0, twoOff); break;
    case 3: add(0, -twoOff); add(0, 0); add(0, twoOff); break;
    case 4: add(-o, -o); add(o, -o); add(-o, o); add(o, o); break;
    case 5: add(-o, -o); add(o, -o); add(0, 0); add(-o, o); add(o, o); break;
    case 6: add(-o, -o); add(o, -o); add(-o, 0); add(o, 0); add(-o, o); add(o, o); break;
    case 7: add(-o, -o); add(o, -o); add(0, -8); add(-o, 0); add(o, 0); add(-o, o); add(o, o); break;
    case 8: add(-o, -o); add(o, -o); add(0, -8); add(-o, 0); add(o, 0); add(0, 8); add(-o, o); add(o, o); break;
    case 9: add(-o, -18); add(0, -18); add(o, -18); add(-o, 0); add(0, 0); add(o, 0); add(-o, 18); add(0, 18); add(o, 18); break;
    case 10: add(-o, -18); add(o, -18); add(0, -9); add(-o, 0); add(o, 0); add(0, 9); add(-o, 18); add(o, 18); add(-o, -30); add(o, -30); break;
  }

  return pips.map((p, i) => (
    <text key={i} x={p.x} y={p.y + 4} textAnchor="middle" fontSize={p.s} fill={color} fontFamily="sans-serif">{sym}</text>
  ));
}

export const Chip: React.FC<{ value: number; size?: number }> = ({ value, size = 34 }) => {
  const colors: Record<number, { outer: string; inner: string; ring: string; text: string; stripes: boolean }> = {
    1: { outer: '#e8e8e8', inner: '#fff', ring: '#ccc', text: '#555', stripes: false },
    5: { outer: '#c1121f', inner: '#e63946', ring: '#780000', text: '#fff', stripes: false },
    10: { outer: '#1565c0', inner: '#1e88e5', ring: '#0d47a1', text: '#fff', stripes: false },
    25: { outer: '#2e7d32', inner: '#43a047', ring: '#1b5e20', text: '#fff', stripes: false },
    50: { outer: '#f57c00', inner: '#fb8c00', ring: '#e65100', text: '#fff', stripes: false },
    100: { outer: '#1a1a2e', inner: '#2d2d44', ring: '#000', text: '#fff', stripes: false },
    500: { outer: '#6a1b9a', inner: '#8e24aa', ring: '#4a148c', text: '#fff', stripes: false },
  };
  const c = colors[value] || colors[5];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <defs>
        <radialGradient id={`chip${value}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor={c.inner}/>
          <stop offset="100%" stopColor={c.outer}/>
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill={`url(#chip${value})`} stroke={c.ring} strokeWidth="2"/>
      <circle cx="20" cy="20" r="13" fill="none" stroke={c.ring} strokeWidth="1" strokeDasharray="3,2"/>
      <circle cx="20" cy="20" r="8" fill="none" stroke={c.ring} strokeWidth="0.5" strokeDasharray="2,2"/>
      {c.stripes && Array.from({ length: 6 }).map((_, i) => (
        <line key={i} x1="8" y1={10 + i * 4} x2="32" y2={10 + i * 4} stroke={c.ring} strokeWidth="1" opacity="0.2"/>
      ))}
      <text x="20" y="23" textAnchor="middle" fontSize="8" fontWeight="bold" fill={c.text} fontFamily="sans-serif">${value}</text>
    </svg>
  );
};

export const ChipStack: React.FC<{ value: number; count: number; size?: number }> = ({ value, count, size = 34 }) => (
  <div style={{ position: 'relative', width: size, height: size + Math.min(count - 1, 8) * 2 }}>
    {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
      <div key={i} style={{ position: 'absolute', top: i * 2, left: 0 }}>
        <Chip value={value} size={size} />
      </div>
    ))}
    {count > 5 && (
      <div style={{ position: 'absolute', top: 10, left: 0, fontSize: 10, color: '#fff', fontWeight: 'bold', textShadow: '0 1px 2px #000' }}>
        ×{count}
      </div>
    )}
  </div>
);
