import React, { useState, useEffect } from 'react';
import { CardFace, Chip } from '../../assets/svg/CardFace';
import type { TexasGameState } from './texasEngine';
import {
  initTexasGame, startTexasRound,
  processTexasAction, getTexasAIAction,
} from './texasEngine';
import '../../styles/game.css';

export const TexasHoldem: React.FC = () => {
  const [game, setGame] = useState<TexasGameState>(() => startTexasRound(initTexasGame()));
  const [raiseAmount, setRaiseAmount] = useState(40);
  const [showdownResult, setShowdownResult] = useState('');

  const player = game.players[0];
  const opponents = game.players.slice(1);

  useEffect(() => {
    if (game.phase === 'finished') return;
    if (game.currentPlayer === 0) return;
    const cp = game.players[game.currentPlayer];
    if (!cp.isAI || cp.hasFolded || cp.isAllIn) return;

    const timer = setTimeout(() => {
      const a = getTexasAIAction(game, game.currentPlayer);
      const newState = processTexasAction(
        game, game.currentPlayer, a.action,
        a.action === 'raise' ? a.amount : undefined
      );
      setGame(newState);

      if (newState.phase === 'finished') {
        setShowdownResult(newState.message);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [game]);

  const handleAction = (action: 'fold' | 'check' | 'call' | 'raise') => {
    if (game.currentPlayer !== 0 || game.phase === 'finished') return;
    const newState = processTexasAction(
      game, 0, action,
      action === 'raise' ? raiseAmount : undefined
    );
    setGame(newState);
    if (newState.phase === 'finished') setShowdownResult(newState.message);
  };

  const handleNewGame = () => {
    const s = initTexasGame();
    s.players.forEach((p,i) => { p.chips = game.players[i]?.chips || 1000; });
    const newGame = startTexasRound(s);
    setGame(newGame);
    setShowdownResult('');
  };

  const toCall = game.currentBet - player.currentBet;
  const canCheck = toCall === 0;
  const canRaise = player.chips + player.currentBet > game.currentBet;
  const isMyTurn = game.currentPlayer === 0 && game.phase !== 'finished';

  const phaseNames: Record<string, string> = {
    preflop: '翻牌前', flop: '翻牌', turn: '转牌', river: '河牌', showdown: '摊牌', finished: '结束'
  };

  return (
    <div className="game-container texas-bg">
      <div className="game-header">
        <h2>🃏 德州扑克</h2>
        <button className="btn-restart" onClick={handleNewGame}>新一局</button>
      </div>

      {game.message && <div className="game-message">{game.message}</div>}
      {showdownResult && <div className="game-message showdown">{showdownResult}</div>}

      {/* Opponents */}
      <div className="texas-opponents">
        {opponents.map((op) => (
          <div key={op.id} className={`texas-opponent ${game.currentPlayer === op.id ? 'active' : ''} ${op.hasFolded ? 'folded' : ''}`}>
            <div className="opponent-name">{op.name}</div>
            <div className="opponent-chips">
              <Chip value={100} size={24} /> ${op.chips}
            </div>
            <div className="opponent-cards">
              {op.cards.map((c, j) => (
                <CardFace key={j} suit={c.suit} rank={c.rank} size={40} faceDown={game.phase !== 'finished' && op.hasFolded === false ? op.id !== 0 : false} small />
              ))}
            </div>
            {op.currentBet > 0 && <div className="bet-amount">下注: ${op.currentBet}</div>}
            {op.hasFolded && <div className="fold-label">弃牌</div>}
            {op.isAllIn && <div className="allin-label">ALL IN</div>}
          </div>
        ))}
      </div>

      {/* Community cards */}
      <div className="community-area">
        <div className="community-label">公共牌</div>
        <div className="community-cards">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="community-card-slot">
              {game.communityCards[i] ? (
                <CardFace suit={game.communityCards[i].suit} rank={game.communityCards[i].rank} size={64} />
              ) : (
                <div className="empty-card-slot" />
              )}
            </div>
          ))}
        </div>
        <div className="pot-display">
          <Chip value={100} size={32} /> 底池: ${game.pot}
        </div>
        <div className="phase-label">{phaseNames[game.phase] || game.phase}</div>
      </div>

      {/* Player area */}
      <div className="texas-player-area">
        <div className="player-info-row">
          <span className="player-name">你</span>
          <span className="player-chips"><Chip value={100} size={24} /> ${player.chips}</span>
          {player.isDealer && <span className="dealer-badge">D</span>}
        </div>
        <div className="player-pocket">
          {player.cards.map((c, i) => (
            <CardFace key={i} suit={c.suit} rank={c.rank} size={72} />
          ))}
        </div>
        {player.currentBet > 0 && <div className="bet-amount">当前下注: ${player.currentBet}</div>}

        {isMyTurn && (
          <div className="texas-actions">
            <button className="btn-texas btn-fold" onClick={() => handleAction('fold')}>弃牌</button>
            {canCheck ? (
              <button className="btn-texas btn-check" onClick={() => handleAction('check')}>过牌</button>
            ) : (
              <button className="btn-texas btn-call" onClick={() => handleAction('call')}>
                跟注 ${toCall}
              </button>
            )}
            {canRaise && (
              <div className="raise-group">
                <input type="range" min={Math.max(game.currentBet * 2, game.bigBlind)}
                  max={player.chips + player.currentBet}
                  value={raiseAmount}
                  onChange={e => setRaiseAmount(Number(e.target.value))}
                  className="raise-slider"
                />
                <button className="btn-texas btn-raise" onClick={() => handleAction('raise')}>
                  加注 ${raiseAmount}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
