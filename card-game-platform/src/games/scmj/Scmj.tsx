import React, { useState, useEffect } from 'react';
import { MahjongTile } from '../../assets/svg/GamePieces';
import { initScMj, selectQue, scmjAction, scmjAI, tileName } from './scmjEngine';
import type { ScMjState, ScMjTile } from './scmjEngine';

const suitLabel: Record<string, string> = { wan: '万', tiao: '条', tong: '筒' };
const suitNames: ScMjTile['suit'][] = ['wan', 'tiao', 'tong'];

export const Scmj: React.FC = () => {
  const [game, setGame] = useState<ScMjState>(initScMj);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const local = game.players[0];
  const opponents = game.players.slice(1);

  useEffect(() => {
    if (game.phase === 'que_select') {
      if (game.currentPlayer === 0) return;
      const timer = setTimeout(() => {
        const aiSuit = suitNames.find(s => {
          const s2 = [...game.players];
          for (let i = 1; i < s2.length; i++) {
            if (!s2[i].que) {
              const counts = { wan: 0, tiao: 0, tong: 0 };
              s2[i].hand.forEach((t: ScMjTile) => counts[t.suit]++);
              const sorted = Object.entries(counts).sort((a: [string, number], b: [string, number]) => a[1] - b[1]);
              return sorted[0][0] === s;
            }
          }
          return false;
        }) || suitNames[0];
        setGame(prev => selectQue(prev, aiSuit as ScMjTile['suit']));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [game]);

  useEffect(() => {
    if (game.phase !== 'playing') return;
    if (game.currentPlayer === 0) return;

    const timer = setTimeout(() => {
      const { action, tile } = scmjAI(game, game.currentPlayer);
      if (action === 'draw') {
        const s1 = scmjAction(game, game.currentPlayer, 'draw');
        if (s1.phase === 'finished') { setGame(s1); return; }
        const { tile: t2 } = scmjAI(s1, s1.currentPlayer);
        if (t2) setGame(scmjAction(s1, s1.currentPlayer, 'discard', t2));
        else setGame(s1);
      } else if (action === 'discard' && tile) {
        setGame(scmjAction(game, game.currentPlayer, 'discard', tile));
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [game]);

  const handleDiscard = () => {
    if (selectedIdx === null || game.currentPlayer !== 0 || game.phase !== 'playing') return;
    if (local.hand.length % 3 === 0) {
      setGame(prev => scmjAction(prev, 0, 'draw'));
      setSelectedIdx(null);
      return;
    }
    setGame(prev => scmjAction(prev, 0, 'discard', local.hand[selectedIdx]));
    setSelectedIdx(null);
  };

  const handleQueSelect = (suit: ScMjTile['suit']) => {
    setGame(prev => selectQue(prev, suit));
  };

  const handleRestart = () => {
    setGame(initScMj());
    setSelectedIdx(null);
  };

  const OpponentInfo: React.FC<{ p: typeof local; pos: string }> = ({ p, pos }) => (
    <div className={`scmj-opponent scmj-${pos} ${game.currentPlayer === p.id ? 'active' : ''}`}>
      <div className="opponent-name">
        {p.name}
        {p.que && <span className="que-badge">{suitLabel[p.que]}</span>}
      </div>
      {p.hu && <span className="hu-badge">胡</span>}
      <div className="mj-discard-row">
        {p.discards.map((t, i) => (
          <MahjongTile key={i} tile={tileName(t)} size={28} small discarded />
        ))}
      </div>
    </div>
  );

  return (
    <div className="game-container texas-bg">
      <div className="game-header">
        <h2>🀄 四川血战到底</h2>
        <button className="btn-restart" onClick={handleRestart}>重新开始</button>
      </div>

      {game.message && <div className="game-message">{game.message}</div>}

      <div className="scmj-info-bar">
        <span>牌山: {game.wall.length} 张</span>
        {local.que && <span>缺门: <span className="que-indicator">{suitLabel[local.que]}</span></span>}
      </div>

      {game.phase === 'que_select' && game.currentPlayer === 0 && (
        <div className="scmj-que-select">
          <div className="que-prompt">选择缺一门:</div>
          <div className="que-buttons">
            {suitNames.map(s => (
              <button key={s} className="btn-que" onClick={() => handleQueSelect(s)}>{suitLabel[s]}</button>
            ))}
          </div>
        </div>
      )}

      <div className="scmj-table">
        {/* Top - opponent 2 */}
        <div className="scmj-top-row">
          <OpponentInfo p={opponents[1]} pos="top" />
        </div>

        {/* Mid row */}
        <div className="scmj-mid-row">
          <OpponentInfo p={opponents[2]} pos="left" />
          <div className="scmj-center">
            {game.phase === 'finished' && (
              <div className="scmj-result">
                {game.players.filter(p => p.hu).map(p => p.name).join('、')} 胡牌！
              </div>
            )}
          </div>
          <OpponentInfo p={opponents[0]} pos="right" />
        </div>
      </div>

      {/* Player area */}
      <div className="scmj-player-area">
        {/* Melds */}
        <div className="mj-player-melds-row">
          {local.melds.map((m, mi) => (
            <div key={mi} className="mj-meld-group">
              {m.tiles.map((t, ti) => (
                <MahjongTile key={ti} tile={tileName(t)} size={44} />
              ))}
              <span className="meld-label">杠</span>
            </div>
          ))}
        </div>

        {/* Hand tiles */}
        <div className="mj-player-tiles">
          {local.hand.map((t, i) => (
            <MahjongTile
              key={t.id}
              tile={tileName(t)}
              size={52}
              onClick={() => {
                if (game.currentPlayer === 0 && game.phase === 'playing') {
                  setSelectedIdx(i === selectedIdx ? null : i);
                }
              }}
              selected={i === selectedIdx}
            />
          ))}
        </div>

        {/* Discard / Draw button */}
        {game.currentPlayer === 0 && game.phase === 'playing' && (
          <div className="scmj-action-row">
            <button
              className="btn-play"
              disabled={selectedIdx === null && local.hand.length % 3 !== 0}
              onClick={handleDiscard}
            >
              {local.hand.length % 3 === 0 ? '摸牌' : selectedIdx !== null ? `出 ${tileName(local.hand[selectedIdx])}` : '选择一张牌'}
            </button>
          </div>
        )}

        {/* Player discard area */}
        <div className="mj-my-discards">
          <div className="discard-label">弃牌:</div>
          <div className="mj-discard-row">
            {local.discards.map((t, i) => (
              <MahjongTile key={i} tile={tileName(t)} size={32} small discarded />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
