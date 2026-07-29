import React from 'react';

/* ========== Chinese Chess Pieces ========== */

const PIECE_NAMES: Record<string, string> = {
  king: '将', advisor: '仕', elephant: '相', knight: '馬', rook: '車', cannon: '炮', pawn: '兵',
  King: '帥', Advisor: '士', Elephant: '象', Knight: '馬', Rook: '車', Cannon: '砲', Pawn: '卒',
  // International chess pieces
  iqueen: '♕', irook: '♖', ibishop: '♗', iknight: '♘', ipawn: '♙',
  iQueen: '♛', iRook: '♜', iBishop: '♝', iKnight: '♞', iPawn: '♟',
  ichess_king_w: '♔', ichess_king_b: '♚',
};

export const ChessPiece: React.FC<{
  type: string; isRed: boolean; size?: number; onClick?: () => void; selected?: boolean;
}> = ({ type, isRed, size = 46, onClick, selected }) => {
  const name = PIECE_NAMES[type] || type;
  const r = size / 2;
  const bgGrad = isRed ? 'cp-red' : 'cp-black';
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        filter: selected
          ? 'drop-shadow(0 0 12px #ffd700) drop-shadow(0 2px 4px rgba(0,0,0,0.6)) brightness(1.2)'
          : 'drop-shadow(0 3px 5px rgba(0,0,0,0.55))',
        transition: 'filter 0.2s',
      }}>
      <defs>
        <radialGradient id={bgGrad} cx="38%" cy="32%">
          {isRed ? (
            <>
              <stop offset="0%" stopColor="#fff8e7"/>
              <stop offset="40%" stopColor="#f5deb3"/>
              <stop offset="100%" stopColor="#c8a45c"/>
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#f0f0f0"/>
              <stop offset="40%" stopColor="#d4d4d4"/>
              <stop offset="100%" stopColor="#888"/>
            </>
          )}
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r - 2.5} fill={`url(#${bgGrad})`}
        stroke={isRed ? '#a0522d' : '#444'} strokeWidth="2.5"/>
      <circle cx={r} cy={r} r={r - 6} fill="none"
        stroke={isRed ? '#c8a45c' : '#999'} strokeWidth="0.8"/>
      <circle cx={r} cy={r} r={r - 8} fill="none"
        stroke={isRed ? '#c8a45c' : '#999'} strokeWidth="0.5" opacity="0.5"/>
      <text x={r} y={r + 1} textAnchor="middle" dominantBaseline="middle"
        fontFamily="'KaiTi','STKaiti','SimSun',serif" fontSize={size * 0.42} fontWeight="bold"
        fill={isRed ? '#b22222' : '#1a1a2e'}>{name}</text>
    </svg>
  );
};

/* ========== Go Stones ========== */

export const GoStone: React.FC<{
  color: 'black' | 'white'; size?: number; onClick?: () => void; lastMove?: boolean;
}> = ({ color, size = 36, onClick, lastMove }) => {
  const r = size / 2;
  const gid = color === 'black' ? 'gs-b' : 'gs-w';

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.5))',
      }}>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%">
          {color === 'black' ? (
            <>
              <stop offset="0%" stopColor="#6a6a8a"/>
              <stop offset="30%" stopColor="#3a3a5a"/>
              <stop offset="100%" stopColor="#111"/>
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="40%" stopColor="#f0f0f0"/>
              <stop offset="100%" stopColor="#c8c8c8"/>
            </>
          )}
        </radialGradient>
      </defs>
      <ellipse cx={r} cy={r - 0.5} rx={r - 1.5} ry={r - 2} fill={`url(#${gid})`}
        stroke={color === 'black' ? '#000' : '#aaa'} strokeWidth="0.8"/>
      {lastMove && (
        <circle cx={r} cy={r - 0.5} r="4" fill={color === 'black' ? '#fff' : '#e63946'} opacity="0.7"/>
      )}
    </svg>
  );
};

/* ========== Mahjong Tiles ========== */

export const MahjongTile: React.FC<{
  tile: string; size?: number; onClick?: () => void; selected?: boolean; discarded?: boolean; small?: boolean;
}> = ({ tile, size = 54, onClick, selected, discarded, small }) => {
  const w = small ? size * 0.85 : size;
  const h = w * 1.38;
  const isRedTile = tile.includes('中');
  const isGreenTile = tile.includes('發');
  const isWhiteBoard = tile.includes('白');
  const textColor = isRedTile ? '#c1121f' : isGreenTile ? '#1b5e20' : '#1a1a2e';
  const bgColor = discarded ? '#e0ddd5' : '#faf6e8';
  const shadow = selected
    ? 'drop-shadow(0 0 10px #ffd700) brightness(1.1)'
    : 'drop-shadow(1px 3px 4px rgba(0,0,0,0.45))';
  const transform = selected ? 'translateY(-8px)' : undefined;

  return (
    <svg width={w} height={h} viewBox="0 0 54 74" onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', filter: shadow, transform, transition: 'transform 0.2s, filter 0.2s' }}>
      <defs>
        <linearGradient id={`mjg-${tile.replace(/[^a-zA-Z]/g,'')}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fefcf5"/>
          <stop offset="100%" stopColor={bgColor}/>
        </linearGradient>
      </defs>
      {/* Outer shadow/border */}
      <rect x="1" y="2" width="52" height="71" rx="5" fill="#8b7355"/>
      {/* Tile face */}
      <rect x="2.5" y="3.5" width="49" height="68" rx="4"
        fill={`url(#mjg-${tile.replace(/[^a-zA-Z]/g,'')})`} stroke="#b8a88a" strokeWidth="1"/>
      {/* Inner bevel */}
      <rect x="5" y="6" width="44" height="63" rx="3" fill="none" stroke="#d4c9b5" strokeWidth="0.5"/>
      <rect x="6.5" y="7.5" width="41" height="60" rx="2" fill="none" stroke="#d4c9b5" strokeWidth="0.3"/>

      {isWhiteBoard ? (
        /* White board tile - blue frame */
        <rect x="14" y="18" width="26" height="36" rx="6" fill="#e8edf2" stroke="#8ca3b8" strokeWidth="1.5"/>
      ) : (
        <text x={w/2} y={h/2 + 2} textAnchor="middle" dominantBaseline="middle"
          fontFamily="'KaiTi','STKaiti','SimSun','Noto Sans SC',serif"
          fontSize={tile.length > 2 ? 13 : 18} fontWeight="bold" fill={textColor}>
          {tile.replace('萬','万').replace('條','条')}
        </text>
      )}
      {/* Subtle engraving shadow */}
      {!isWhiteBoard && (
        <text x={w/2 + 0.5} y={h/2 + 2.5} textAnchor="middle" dominantBaseline="middle"
          fontFamily="'KaiTi','STKaiti','SimSun','Noto Sans SC',serif"
          fontSize={tile.length > 2 ? 13 : 18} fontWeight="bold" fill="#000" opacity="0.06">
          {tile.replace('萬','万').replace('條','条')}
        </text>
      )}
    </svg>
  );
};

/* ========== Mahjong Wall (face down stack) ========== */

export const MahjongTileBack: React.FC<{ size?: number }> = ({ size = 32 }) => {
  const h = size * 1.38;
  return (
    <svg width={size} height={h} viewBox="0 0 54 74">
      <defs>
        <linearGradient id="mjb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2e7d32"/>
          <stop offset="100%" stopColor="#1b5e20"/>
        </linearGradient>
      </defs>
      <rect x="1" y="2" width="52" height="71" rx="5" fill="#5d4037"/>
      <rect x="2.5" y="3.5" width="49" height="68" rx="4" fill="url(#mjb)" stroke="#1b5e20" strokeWidth="1"/>
      <rect x="8" y="10" width="38" height="54" rx="3" fill="none" stroke="#4caf50" strokeWidth="0.5" opacity="0.5"/>
    </svg>
  );
};
