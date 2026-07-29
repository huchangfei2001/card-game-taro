import React, { useState, useEffect } from 'react';
import { MahjongTile } from '../../assets/svg/GamePieces';
import { initRiichi, riichiAction, riichiAI } from './riichimahjongEngine';
import type { RiichiState, RiichiTile } from './riichimahjongEngine';

function riichiTileDisplay(t: RiichiTile): string {
  if (t.type.startsWith('man')) return t.type.replace('man', '') + '万';
  if (t.type.startsWith('pin')) return t.type.replace('pin', '') + '筒';
  if (t.type.startsWith('sou')) return t.type.replace('sou', '') + '条';
  const windNames: Record<string, string> = { east: '東', south: '南', west: '西', north: '北' };
  const dragonNames: Record<string, string> = { haku: '白', hatsu: '發', chun: '中' };
  return windNames[t.type] || dragonNames[t.type] || t.type;
}

export const RiichiMahjong: React.FC = () => {
  const [game, setGame] = useState<RiichiState>(initRiichi);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const local = game.players[0];
  const opponents = game.players.slice(1);

  useEffect(() => {
    if (game.phase !== 'playing') return;
    if (game.currentPlayer === 0) return;

    const timer = setTimeout(() => {
      const { action, tile } = riichiAI(game, game.currentPlayer);
      if (action === 'riichi') {
        setGame(prev => riichiAction(prev, game.currentPlayer, 'riichi'));
      } else if (action === 'draw') {
        const s1 = riichiAction(game, game.currentPlayer, 'draw');
        if (s1.phase === 'finished') { setGame(s1); return; }
        const { tile: t2 } = riichiAI(s1, s1.currentPlayer);
        if (t2) setGame(riichiAction(s1, s1.currentPlayer, 'discard', t2));
        else setGame(s1);
      } else if (action === 'discard' && tile) {
        setGame(riichiAction(game, game.currentPlayer, 'discard', tile));
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [game]);

  const handleTileClick = (idx: number) => {
    if (game.currentPlayer !== 0 || game.phase !== 'playing') return;
    if (local.hand.length % 3 === 0) return;
    setSelectedIdx(idx === selectedIdx ? null : idx);
  };

  const handleDiscard = () => {
    if (selectedIdx === null || game.currentPlayer !== 0 || game.phase !== 'playing') return;
    setGame(prev => riichiAction(prev, 0, 'discard', local.hand[selectedIdx]));
    setSelectedIdx(null);
  };

  const handleDraw = () => {
    if (game.currentPlayer !== 0 || game.phase !== 'playing' || local.hand.length % 3 !== 0) return;
    setGame(prev => riichiAction(prev, 0, 'draw'));
  };

  const handleRiichi = () => {
    if (game.currentPlayer !== 0 || game.phase !== 'playing') return;
    setGame(prev => riichiAction(prev, 0, 'riichi'));
  };

  const handleRestart = () => {
    setGame(initRiichi());
    setSelectedIdx(null);
  };

  const OpponentInfo: React.FC<{ p: typeof local; pos: string }> = ({ p, pos }) => (
    <div className={`riichi-opponent riichi-${pos} ${game.currentPlayer === p.id ? 'active' : ''}`}>
      <div className="opponent-name">
        {p.name}
        {p.riichi && <span className="riichi-badge">立直</span>}
        {p.ippatsu && <span className="ippatsu-badge">一发</span>}
      </div>
      <div className="opponent-score">¥{p.score.toLocaleString()}</div>
      <div className="mj-discard-row">
        {p.discards.map((t, i) => (
          <MahjongTile key={i} tile={riichiTileDisplay(t)} size={28} small discarded />
        ))}
      </div>
    </div>
  );

  return (
    <div className="game-container texas-bg">
      <div className="game-header">
        <h2>🀄 立直麻将</h2>
        <button className="btn-restart" onClick={handleRestart}>重新开始</button>
      </div>

      {game.message && <div className="game-message">{game.message}</div>}

      <div className="riichi-info-bar">
        <span>牌山: {game.wall.length} 张</span>
        <span className="dora-label">
          宝牌指示牌:
          {game.doraIndicators.map((t, i) => (
            <MahjongTile key={i} tile={riichiTileDisplay(t)} size={32} small />
          ))}
        </span>
        {local.riichi && <span className="riichi-badge">立直中</span>}
        {local.ippatsu && <span className="ippatsu-badge">一発</span>}
      </div>

      <div className="riichi-table">
        <div className="riichi-top-row">
          <OpponentInfo p={opponents[1]} pos="top" />
        </div>

        <div className="riichi-mid-row">
          <OpponentInfo p={opponents[2]} pos="left" />
          <div className="riichi-center">
            {game.phase === 'finished' && (
              <div className="riichi-result">{game.message}</div>
            )}
          </div>
          <OpponentInfo p={opponents[0]} pos="right" />
        </div>
      </div>

      {/* Player area */}
      <div className="riichi-player-area">
        <div className="riichi-player-info">
          <span className="player-score-label">¥{local.score.toLocaleString()}</span>
          {local.riichi && <span className="riichi-badge">立直</span>}
          {local.ippatsu && <span className="ippatsu-badge">一发</span>}
        </div>

        {/* Melds */}
        <div className="mj-player-melds-row">
          {local.melds.map((m, mi) => (
            <div key={mi} className="mj-meld-group">
              {m.tiles.map((t, ti) => (
                <MahjongTile key={ti} tile={riichiTileDisplay(t)} size={44} />
              ))}
              <span className="meld-label">{m.type === 'pon' ? '碰' : m.type === 'chi' ? '吃' : '杠'}</span>
            </div>
          ))}
        </div>

        {/* Hand tiles */}
        <div className="mj-player-tiles">
          {local.hand.map((t, i) => (
            <MahjongTile
              key={t.id}
              tile={riichiTileDisplay(t)}
              size={52}
              onClick={() => handleTileClick(i)}
              selected={i === selectedIdx}
            />
          ))}
        </div>

        {/* Action buttons */}
        {game.currentPlayer === 0 && game.phase === 'playing' && (
          <div className="riichi-action-row">
            {local.hand.length % 3 === 0 ? (
              <button className="btn-play" onClick={handleDraw}>摸牌</button>
            ) : (
              <>
                {!local.melds.length && !local.riichi && (
                  <button className="btn-play btn-riichi" onClick={handleRiichi}>立直</button>
                )}
                <button
                  className="btn-play"
                  disabled={selectedIdx === null}
                  onClick={handleDiscard}
                >
                  {selectedIdx !== null ? `打出 ${riichiTileDisplay(local.hand[selectedIdx])}` : '选择一张牌'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Player discards */}
        <div className="mj-my-discards">
          <div className="discard-label">弃牌:</div>
          <div className="mj-discard-row">
            {local.discards.map((t, i) => (
              <MahjongTile key={i} tile={riichiTileDisplay(t)} size={32} small discarded />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
