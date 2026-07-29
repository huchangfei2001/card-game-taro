import React, { useState } from 'react';
import { CardFace } from '../../assets/svg/CardFace';
import { initShisanshui, autoArrange, arrangeShs } from './shisanshuiEngine';
import type { ShsState } from './shisanshuiEngine';
import type { Card } from '../../types';

const cardKey = (c: Card) => `${c.suit}-${c.rank}`;

export const Shisanshui: React.FC = () => {
  const [state, setState] = useState<ShsState>(initShisanshui());
  const [activeLane, setActiveLane] = useState<'front' | 'middle' | 'back'>('back');
  const [front, setFront] = useState<Card[]>([]);
  const [middle, setMiddle] = useState<Card[]>([]);
  const [back, setBack] = useState<Card[]>([]);
  const [pool, setPool] = useState<Card[]>([...state.players[0].cards]);

  const player = state.players[0];
  const opponents = state.players.slice(1);

  const moveToLane = (c: Card) => {
    if (state.phase !== 'arranging') return;
    const lane = activeLane;
    const max = lane === 'front' ? 3 : 5;
    const current = lane === 'front' ? front : lane === 'middle' ? middle : back;
    if (current.length >= max) return;

    const ck = cardKey(c);
    setPool(p => p.filter(x => cardKey(x) !== ck));
    if (lane === 'front') setFront([...front, c].sort((a, b) => (b.rank === 1 ? 14 : b.rank) - (a.rank === 1 ? 14 : a.rank)));
    else if (lane === 'middle') setMiddle([...middle, c].sort((a, b) => (b.rank === 1 ? 14 : b.rank) - (a.rank === 1 ? 14 : a.rank)));
    else setBack([...back, c].sort((a, b) => (b.rank === 1 ? 14 : b.rank) - (a.rank === 1 ? 14 : a.rank)));
  };

  const moveToPool = (c: Card, from: 'front' | 'middle' | 'back') => {
    if (state.phase !== 'arranging') return;
    const ck = cardKey(c);
    if (from === 'front') setFront(f => f.filter(x => cardKey(x) !== ck));
    else if (from === 'middle') setMiddle(m => m.filter(x => cardKey(x) !== ck));
    else setBack(b => b.filter(x => cardKey(x) !== ck));
    setPool(p => [...p, c].sort((a, b) => (b.rank === 1 ? 14 : b.rank) - (a.rank === 1 ? 14 : a.rank)));
  };

  const handleAutoArrange = () => {
    const p = autoArrange({ ...player, front: [], middle: [], back: [] });
    setFront(p.front);
    setMiddle(p.middle);
    setBack(p.back);
    setPool([]);
  };

  const handleSubmit = () => {
    if (front.length !== 3 || middle.length !== 5 || back.length !== 5) return;
    const newState = arrangeShs(state, front, middle, back);
    setState(newState);
  };

  const handleRestart = () => {
    const s = initShisanshui();
    setState(s);
    setFront([]);
    setMiddle([]);
    setBack([]);
    setPool([...s.players[0].cards]);
    setActiveLane('back');
  };

  const poolSorted = [...pool].sort((a, b) => (b.rank === 1 ? 14 : b.rank) - (a.rank === 1 ? 14 : a.rank));

  return (
    <div className="game-container texas-bg">
      <div className="game-header">
        <h2>🃏 十三水</h2>
        <button className="btn-restart" onClick={handleRestart}>重新开始</button>
      </div>

      {state.message && <div className="game-message">{state.message}</div>}

      {state.phase === 'arranging' && (
        <>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
            {(['back', 'middle', 'front'] as const).map(lane => (
              <button
                key={lane}
                className={activeLane === lane ? 'btn-bid' : 'btn-bid btn-pass'}
                style={{ fontSize: 12, padding: '5px 14px' }}
                onClick={() => setActiveLane(lane)}
              >
                {lane === 'back' ? '尾道 (5张)' : lane === 'middle' ? '中道 (5张)' : '头道 (3张)'}
                {lane === 'back' && ` ${back.length}/5`}
                {lane === 'middle' && ` ${middle.length}/5`}
                {lane === 'front' && ` ${front.length}/3`}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#e9c46a', fontSize: 13, textAlign: 'center', marginBottom: 4 }}>尾道 - {back.length}/5</div>
            <div style={{ display: 'flex', gap: 3, justifyContent: 'center', minHeight: 48 }}>
              {back.map((c, i) => (
                <CardFace key={i} suit={c.suit} rank={c.rank} size={40} onClick={() => moveToPool(c, 'back')} />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#e9c46a', fontSize: 13, textAlign: 'center', marginBottom: 4 }}>中道 - {middle.length}/5</div>
            <div style={{ display: 'flex', gap: 3, justifyContent: 'center', minHeight: 48 }}>
              {middle.map((c, i) => (
                <CardFace key={i} suit={c.suit} rank={c.rank} size={40} onClick={() => moveToPool(c, 'middle')} />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#e9c46a', fontSize: 13, textAlign: 'center', marginBottom: 4 }}>头道 - {front.length}/3</div>
            <div style={{ display: 'flex', gap: 3, justifyContent: 'center', minHeight: 48 }}>
              {front.map((c, i) => (
                <CardFace key={i} suit={c.suit} rank={c.rank} size={40} onClick={() => moveToPool(c, 'front')} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#a09080', fontSize: 12, textAlign: 'center', marginBottom: 4 }}>
              手牌 (点击加入{activeLane === 'back' ? '尾道' : activeLane === 'middle' ? '中道' : '头道'})
            </div>
            <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              {poolSorted.map((c, i) => (
                <CardFace key={i} suit={c.suit} rank={c.rank} size={48} onClick={() => moveToLane(c)} />
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-play" onClick={handleSubmit}
              disabled={front.length !== 3 || middle.length !== 5 || back.length !== 5}>
              确认排列
            </button>
            <button className="btn-pass" onClick={handleAutoArrange}>自动排列</button>
          </div>
        </>
      )}

      {state.phase === 'finished' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <h3 style={{ color: '#e9c46a' }}>你的排列</h3>
            <div className="player-hand" style={{ marginTop: 0 }}>
              <div style={{ color: '#a09080', fontSize: 12, marginBottom: 2 }}>头道: {player.handType?.split('-')[2]}</div>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 6 }}>
                {player.front.map((c, i) => <CardFace key={i} suit={c.suit} rank={c.rank} size={44} />)}
              </div>
              <div style={{ color: '#a09080', fontSize: 12, marginBottom: 2 }}>中道: {player.handType?.split('-')[1]}</div>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 6 }}>
                {player.middle.map((c, i) => <CardFace key={i} suit={c.suit} rank={c.rank} size={44} />)}
              </div>
              <div style={{ color: '#a09080', fontSize: 12, marginBottom: 2 }}>尾道: {player.handType?.split('-')[0]}</div>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                {player.back.map((c, i) => <CardFace key={i} suit={c.suit} rank={c.rank} size={44} />)}
              </div>
            </div>
          </div>

          <div className="texas-opponents" style={{ justifyContent: 'center' }}>
            {opponents.map(opp => (
              <div key={opp.id} className="texas-opponent">
                <div className="opponent-name">{opp.name}</div>
                <div className="opponent-chips">${opp.chips}</div>
                <div style={{ fontSize: 11, color: '#a09080' }}>{opp.handType}</div>
                <div style={{ display: 'flex', gap: 1, justifyContent: 'center', marginTop: 4 }}>
                  {[...opp.front, ...opp.middle, ...opp.back].slice(0, 8).map((c, i) => (
                    <CardFace key={i} suit={c.suit} rank={c.rank} size={28} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="btn-restart" onClick={handleRestart}>再来一局</button>
          </div>
        </>
      )}
    </div>
  );
};
