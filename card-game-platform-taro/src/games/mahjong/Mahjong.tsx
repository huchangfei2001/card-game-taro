import React, { useState, useEffect } from 'react';
import { MahjongTile } from '../../assets/svg/GamePieces';
import { initMahjongGame, drawTile, discardTile, pengTile, gangTile, getMahjongAIAction } from './mahjongEngine';
import type { MahjongGameState } from './mahjongEngine';

function canWinSimple(tiles: string[], laizi: string): boolean {
  const nonLaizi = tiles.filter(t => t !== '中' && t !== laizi);
  const laiziCount = tiles.length - nonLaizi.length;
  const counts = new Map<string, number>();
  nonLaizi.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));

  for (const [, cnt] of counts) {
    if (cnt >= 2) {
      const test = new Map(counts);
      test.set([...counts.keys()].find(k => counts.get(k) === cnt)!, cnt - 2);
      if (checkMelds(test, laiziCount)) return true;
    }
  }
  if (laiziCount >= 1 && checkMelds(counts, laiziCount - 1)) return true;
  if (laiziCount >= 2 && checkMelds(counts, laiziCount - 2)) return true;
  return false;
}

function checkMelds(counts: Map<string, number>, laizi: number): boolean {
  let total = 0;
  for (const c of counts.values()) total += c;
  if (total === 0) return laizi % 3 === 0;

  const tiles = [...counts.keys()].filter(t => (counts.get(t) || 0) > 0);
  if (tiles.length === 0) return laizi % 3 === 0;
  const first = tiles[0];
  const cnt = counts.get(first) || 0;

  if (cnt >= 3) {
    const next = new Map(counts);
    next.set(first, cnt - 3);
    if (checkMelds(next, laizi)) return true;
  }
  if (cnt >= 2 && laizi >= 1) {
    const next = new Map(counts);
    next.set(first, cnt - 2);
    if (checkMelds(next, laizi - 1)) return true;
  }
  if (cnt >= 1 && laizi >= 2) {
    const next = new Map(counts);
    next.set(first, cnt - 1);
    if (checkMelds(next, laizi - 2)) return true;
  }

  const suit = getSuit(first);
  if (suit) {
    const n1 = getNext(first);
    const n2 = n1 ? getNext(n1) : '';
    if (n1 && n2 && (counts.get(n1) || 0) > 0 && (counts.get(n2) || 0) > 0) {
      const next = new Map(counts);
      next.set(first, cnt - 1);
      next.set(n1, (next.get(n1) || 0) - 1);
      next.set(n2, (next.get(n2) || 0) - 1);
      if (checkMelds(next, laizi)) return true;
    }
  }
  return false;
}

function getSuit(tile: string): string | null {
  if (tile.includes('萬')) return 'wan';
  if (tile.includes('筒')) return 'tong';
  if (tile.includes('條') || tile.includes('条')) return 'tiao';
  return null;
}

function getNext(tile: string): string {
  const suits: Record<string, string[]> = {
    wan: ['一萬','二萬','三萬','四萬','五萬','六萬','七萬','八萬','九萬'],
    tong: ['一筒','二筒','三筒','四筒','五筒','六筒','七筒','八筒','九筒'],
    tiao: ['一條','二條','三條','四條','五條','六條','七條','八條','九條'],
  };
  const s = getSuit(tile);
  if (!s) return '';
  const arr = suits[s];
  const idx = arr.indexOf(tile);
  return idx >= 0 && idx < 8 ? arr[idx + 1] : '';
}

export const Mahjong: React.FC = () => {
  const [game, setGame] = useState<MahjongGameState>(initMahjongGame());
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [actions, setActions] = useState<{ peng: boolean; gang: boolean; win: boolean }>({ peng: false, gang: false, win: false });

  const player = game.players[0];
  const right = game.players[1];
  const top = game.players[2];
  const left = game.players[3];

  // Check if player can act on last discard
  useEffect(() => {
    if (game.lastDiscard && game.lastDiscard.playerId !== 0 && game.phase === 'playing' && game.currentPlayer === 0) {
      const tile = game.lastDiscard.tile;
      const count = player.tiles.filter(t => t === tile).length;
      setActions({
        peng: count >= 2,
        gang: count >= 3,
        win: canWinSimple([...player.tiles, tile], game.laizi),
      });
    } else {
      setActions({ peng: false, gang: false, win: false });
    }
  }, [game]);

  // AI turns
  useEffect(() => {
    if (game.phase !== 'playing') return;
    if (game.currentPlayer === 0) {
      if (game.turnPhase === 'draw' && game.winner === null) {
        setTimeout(() => setGame(drawTile(game, 0)), 300);
      }
      return;
    }

    const timer = setTimeout(() => {
      const cp = game.currentPlayer;
      const aiAction = getMahjongAIAction(game, cp);

      switch (aiAction.action) {
        case 'draw': {
          let s = drawTile(game, cp);
          // Auto discard after draw
          const disc = getMahjongAIAction(s, cp);
          if (disc.action === 'discard') s = discardTile(s, cp, disc.tileIndex);
          setGame(s);
          break;
        }
        case 'discard':
          setGame(discardTile(game, cp, aiAction.tileIndex));
          break;
        case 'peng':
          setGame(pengTile(game, cp));
          break;
        case 'gang':
          setGame(gangTile(game, cp));
          break;
        case 'win':
          setGame(prev => ({
            ...prev,
            winner: cp,
            phase: 'finished' as const,
            message: `${prev.players[cp].name} 胡了！`,
          }));
          break;
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [game]);

  const handleDiscard = (index: number) => {
    if (game.currentPlayer !== 0 || game.turnPhase !== 'discard' || game.phase !== 'playing') return;
    setGame(discardTile(game, 0, index));
    setSelectedTile(null);
    setActions({ peng: false, gang: false, win: false });
  };

  const handlePeng = () => {
    if (!actions.peng) return;
    setGame(pengTile(game, 0));
    setActions({ peng: false, gang: false, win: false });
  };

  const handleGang = () => {
    if (!actions.gang) return;
    setGame(gangTile(game, 0));
    setActions({ peng: false, gang: false, win: false });
  };

  const handleRestart = () => {
    setGame(initMahjongGame());
    setSelectedTile(null);
    setActions({ peng: false, gang: false, win: false });
  };

  const OpponentArea: React.FC<{ p: typeof player; className: string }> = ({ p, className }) => (
    <div className={`mj-opponent ${className} ${game.currentPlayer === p.id ? 'active' : ''}`}>
      <div className="opponent-name">{p.name}</div>
      <div className="mj-melds">
        {p.melds.map((m, mi) => (
          <div key={mi} className="mj-meld-group">
            {m.tiles.map((t, ti) => <MahjongTile key={ti} tile={t} size={30} small />)}
            <span className="meld-label">{m.type === 'peng' ? '碰' : m.type === 'gang' ? '杠' : '暗'}</span>
          </div>
        ))}
      </div>
      <div className="mj-hidden-count">🀫 ×{p.tiles.length}</div>
      <div className="mj-discard-row">
        {p.discarded.map((t, ti) => (
          <MahjongTile key={ti} tile={t} size={28} small discarded />
        ))}
      </div>
    </div>
  );

  return (
    <div className="game-container mahjong-bg">
      <div className="game-header">
        <h2>🀄 红中赖子杠</h2>
        <button className="btn-restart" onClick={handleRestart}>重新开始</button>
      </div>

      {game.message && <div className="game-message">{game.message}</div>}

      <div className="mj-info-bar">
        <span className="laizi-label">赖子: <MahjongTile tile={game.laizi} size={32} small /></span>
        <span className="wall-count">牌山: {game.wall.length} 张</span>
      </div>

      {/* Four-player table layout */}
      <div className="mj-table">
        {/* Top opponent */}
        <div className="mj-top-row">
          <OpponentArea p={top} className="mj-top" />
        </div>

        {/* Middle row: left AI, center (discard area), right AI */}
        <div className="mj-mid-row">
          <OpponentArea p={left} className="mj-left-opp" />
          <div className="mj-center-area">
            {/* Last discard display */}
            {game.lastDiscard && (
              <div className="mj-discard-display">
                <div style={{ fontSize: 12, color: '#888' }}>
                  {game.players[game.lastDiscard.playerId].name} 打出
                </div>
                <MahjongTile tile={game.lastDiscard.tile} size={52} />
                {game.lastDiscard.playerId !== 0 && game.currentPlayer === 0 && (
                  <div className="mj-actions">
                    {actions.peng && <button className="btn-mj-action" onClick={handlePeng}>碰</button>}
                    {actions.gang && <button className="btn-mj-action" onClick={handleGang}>杠</button>}
                    {actions.win && <button className="btn-mj-action btn-mj-win" onClick={() => {}}>胡!</button>}
                  </div>
                )}
              </div>
            )}
            {!game.lastDiscard && (
              <div className="mj-discard-display" style={{ color: '#666', fontSize: 14 }}>
                等待出牌...
              </div>
            )}
          </div>
          <OpponentArea p={right} className="mj-right-opp" />
        </div>
      </div>

      {/* Player melds */}
      <div className="mj-player-melds-row">
        {player.melds.map((m, mi) => (
          <div key={mi} className="mj-meld-group">
            {m.tiles.map((t, ti) => <MahjongTile key={ti} tile={t} size={44} />)}
            <span className="meld-label">{m.type === 'peng' ? '碰' : m.type === 'gang' ? '杠' : '暗杠'}</span>
          </div>
        ))}
      </div>

      {/* Player tiles */}
      <div className="mj-player-tiles">
        {player.tiles.map((tile, i) => (
          <MahjongTile
            key={i}
            tile={tile}
            size={52}
            onClick={() => {
              if (game.currentPlayer === 0 && game.turnPhase === 'discard' && game.phase === 'playing') {
                setSelectedTile(i === selectedTile ? null : i);
              }
            }}
            selected={i === selectedTile}
          />
        ))}
      </div>

      {/* Discard button */}
      {game.currentPlayer === 0 && game.turnPhase === 'discard' && game.phase === 'playing' && selectedTile !== null && (
        <div className="mj-discard-btn">
          <button className="btn-play" onClick={() => handleDiscard(selectedTile)}>
            打出 {player.tiles[selectedTile]}
          </button>
        </div>
      )}

      {/* Player's discard area */}
      <div className="mj-my-discards">
        <div className="discard-label">我的弃牌:</div>
        <div className="mj-discard-row">
          {player.discarded.map((t, ti) => (
            <MahjongTile key={ti} tile={t} size={32} small discarded />
          ))}
        </div>
      </div>
    </div>
  );
};
