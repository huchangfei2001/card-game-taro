import React, { useState, useEffect, useRef } from 'react';
import { CardFace } from '../../assets/svg/CardFace';
import { initZjh, zjhAction, dealZjh, zjhAI } from './zhajinhuaEngine';
import type { ZjhState } from './zhajinhuaEngine';

export const ZhaJinhua: React.FC = () => {
  const [state, setState] = useState<ZjhState>(() => {
    const s = initZjh();
    return dealZjh(s);
  });
  const hasActed = useRef(false);

  useEffect(() => {
    if (state.phase !== 'betting' && state.phase !== 'dealing') return;
    if (state.currentPlayer === 0) { hasActed.current = false; return; }
    if (hasActed.current) return;
    hasActed.current = true;
    const t = setTimeout(() => {
      const ai = zjhAI(state, state.currentPlayer);
      const act = ai.action === 'raise' ? 'raise' : ai.action === 'fold' ? 'fold' : 'call';
      setState(zjhAction(state, state.currentPlayer, act, ai.amount));
    }, 600);
    return () => clearTimeout(t);
  }, [state]);

  const player = state.players[0];

  const handleCall = () => { hasActed.current = false; setState(zjhAction(state, 0, 'call')); };
  const handleRaise = () => { hasActed.current = false; setState(zjhAction(state, 0, 'raise', state.currentBet + 10)); };
  const handleFold = () => { hasActed.current = false; setState(zjhAction(state, 0, 'fold')); };
  const handleRestart = () => setState(dealZjh(initZjh()));

  return (
    <div className="game-container texas-bg">
      <div className="game-header"><h2>🃏 炸金花</h2><button className="btn-restart" onClick={handleRestart}>重新开始</button></div>
      {state.message && <div className="game-message">{state.message}</div>}
      <div style={{ textAlign: 'center', color: '#e9c46a', fontWeight: 600, marginBottom: 10 }}>
        底池: ${state.pot} | 当前注: ${state.currentBet}
      </div>

      {/* AI players */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
        {state.players.slice(1).map(ai => (
          <div key={ai.id} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 8, textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#aaa' }}>{ai.name} (${ai.chips})</div>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {ai.cards.length ? ai.cards.map((c, i) => (
                <CardFace key={i} suit={c.suit} rank={c.rank} size={40} small
                  faceDown={!ai.folded && state.phase !== 'finished'} />
              )) : <span style={{ color: '#666' }}>?</span>}
            </div>
            {ai.folded && <div style={{ fontSize: 12, color: '#c0392b', marginTop: 2 }}>已弃牌</div>}
            {state.currentPlayer === ai.id && state.phase === 'betting' && (
              <div style={{ fontSize: 11, color: '#e9c46a', marginTop: 2 }}>思考中...</div>
            )}
          </div>
        ))}
      </div>

      {/* Player */}
      <div style={{ textAlign: 'center', margin: '12px 0' }}>
        <div style={{ color: '#fff', marginBottom: 6 }}>
          {player.name} (${player.chips}) {player.folded && <span style={{ color: '#c0392b' }}>已弃牌</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {player.cards.length ? player.cards.map((c, i) => (
            <CardFace key={i} suit={c.suit} rank={c.rank} size={72}
              faceDown={!player.folded && state.phase !== 'finished'} />
          )) : <span style={{ color: '#666' }}>发牌中...</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {state.phase === 'betting' && state.currentPlayer === 0 && !player.folded && (
          <>
            <button className="btn-texas btn-check" onClick={handleCall}>跟注</button>
            <button className="btn-texas btn-raise" onClick={handleRaise}>加注</button>
            <button className="btn-texas btn-fold" onClick={handleFold}>弃牌</button>
          </>
        )}
        {state.phase === 'finished' && (
          <button className="btn-texas btn-raise" onClick={handleRestart}>再来一局</button>
        )}
      </div>
    </div>
  );
};
