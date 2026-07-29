// Strikers 1945 Engine

export interface PlayerShip {
  x: number; y: number; hp: number; bombs: number; power: number;
  cooldown: number; invincible: number; charge: number; fired: boolean;
}

export interface Bullet {
  x: number; y: number; vx: number; vy: number; isEnemy: boolean;
  size: number; damage: number;
}

export interface Enemy {
  x: number; y: number; hp: number; maxHp: number;
  pattern: number; timer: number; speed: number; score: number;
  size: number; color: string; type: 'small' | 'medium' | 'boss';
}

export interface Item {
  x: number; y: number; type: 'power' | 'bomb' | 'score';
  vy: number;
}

export interface S1945State {
  player: PlayerShip;
  bullets: Bullet[];
  enemies: Enemy[];
  items: Item[];
  score: number;
  stage: number;
  stageTimer: number;
  scrollY: number;
  gameOver: boolean;
  paused: boolean;
  message: string;
}

export function initS1945(): S1945State {
  return {
    player: { x: 200, y: 480, hp: 5, bombs: 3, power: 1, cooldown: 0, invincible: 0, charge: 0, fired: false },
    bullets: [], enemies: [], items: [], score: 0, stage: 1,
    stageTimer: 0, scrollY: 0, gameOver: false, paused: false,
    message: 'Strikers 1945 - 消灭所有敌人!',
  };
}

export function movePlayer(state: S1945State, dx: number, dy: number): S1945State {
  const p = state.player;
  return {
    ...state, player: {
      ...p, x: Math.max(10, Math.min(470, p.x + dx)), y: Math.max(50, Math.min(550, p.y + dy)),
    },
  };
}

export function playerShootS1945(state: S1945State): S1945State {
  const p = state.player;
  if (state.gameOver || p.cooldown > 0) return state;
  const bullets = [...state.bullets];
  const bulletSpeed = -8;
  // Normal shot
  const centerBullets: Bullet[] = [];
  centerBullets.push({ x: p.x, y: p.y - 10, vx: 0, vy: bulletSpeed, isEnemy: false, size: 3, damage: 1 });
  if (p.power >= 2) { centerBullets.push({ x: p.x - 8, y: p.y, vx: 0, vy: bulletSpeed, isEnemy: false, size: 3, damage: 1 }); centerBullets.push({ x: p.x + 8, y: p.y, vx: 0, vy: bulletSpeed, isEnemy: false, size: 3, damage: 1 }); }
  if (p.power >= 3) { centerBullets.push({ x: p.x - 16, y: p.y + 5, vx: -1, vy: bulletSpeed, isEnemy: false, size: 3, damage: 1 }); centerBullets.push({ x: p.x + 16, y: p.y + 5, vx: 1, vy: bulletSpeed, isEnemy: false, size: 3, damage: 1 }); }
  bullets.push(...centerBullets);

  // Charge shot
  if (p.charge >= 30 && !p.fired) {
    bullets.push({ x: p.x, y: p.y - 20, vx: 0, vy: bulletSpeed * 1.5, isEnemy: false, size: 8, damage: 10 });
    return { ...state, bullets, player: { ...p, cooldown: 8, charge: 0, fired: true } };
  }

  return { ...state, bullets, player: { ...p, cooldown: 4, fired: false } };
}

export function useBomb(state: S1945State): S1945State {
  const p = state.player;
  if (state.gameOver || p.bombs <= 0) return state;
  const enemies = state.enemies.map(e => ({ ...e, hp: e.hp - 5 }));
  const bullets = state.bullets.filter(b => b.isEnemy);
  return {
    ...state, player: { ...p, bombs: p.bombs - 1, invincible: 30 },
    enemies, bullets, message: '炸弹!',
  };
}

export function tickS1945(state: S1945State, width: number, height: number): S1945State {
  if (state.gameOver || state.paused) return state;
  let s = { ...state,
    player: { ...state.player, cooldown: Math.max(0, state.player.cooldown - 1), invincible: Math.max(0, state.player.invincible - 1), charge: Math.min(60, state.player.charge + 1) },
    bullets: [...state.bullets], enemies: [...state.enemies], items: [...state.items],
  };

  s.scrollY = (s.scrollY + 1) % 32;
  s.stageTimer++;

  // Spawn enemies
  if (s.stageTimer < 600) {
    if (s.stageTimer % 40 === 0) {
      s.enemies.push({
        x: 40 + Math.random() * 380, y: -20, hp: 2 + s.stage, maxHp: 5, pattern: 0, timer: 0, speed: 1.5 + s.stage * 0.3,
        score: 100, size: 20, color: '#e74c3c', type: 'small',
      });
    }
  } else if (s.stageTimer === 600) {
    s.enemies.push({
      x: 240, y: -40, hp: 30 + s.stage * 20, maxHp: 50, pattern: 1, timer: 0, speed: 0.5,
      score: 2000, size: 40, color: '#9b59b6', type: 'boss',
    });
    s.message = 'WARNING - BOSS!';
  }

  // Move enemies
  for (const e of s.enemies) {
    e.timer++;
    if (e.type === 'small') {
      e.y += e.speed;
      // Simple zigzag
      e.x += Math.sin(e.timer * 0.05) * 1.5;
      // Shoot
      if (e.timer % 60 === 0) {
        const dx2 = s.player.x - e.x, dy = s.player.y - e.y;
        const dist = Math.max(1, Math.hypot(dx2, dy));
        s.bullets.push({ x: e.x, y: e.y, vx: (dx2 / dist) * 2.5, vy: (dy / dist) * 2.5, isEnemy: true, size: 4, damage: 1 });
      }
    } else if (e.type === 'boss') {
      // Boss moves to center
      if (e.y < 100) e.y += e.speed * 2;
      else {
        e.x += Math.sin(e.timer * 0.03) * 1.5;
        // Boss patterns
        if (e.timer % 12 === 0) {
          for (let a = 0; a < 360; a += 20) {
            const rad = a * Math.PI / 180;
            s.bullets.push({ x: e.x, y: e.y, vx: Math.cos(rad) * 1.8, vy: Math.sin(rad) * 1.8, isEnemy: true, size: 3, damage: 1 });
          }
        }
        if (e.timer % 40 === 0) {
          const dx3 = s.player.x - e.x, dy3 = s.player.y - e.y;
          const dist3 = Math.hypot(dx3, dy3);
          s.bullets.push({ x: e.x, y: e.y, vx: (dx3 / dist3) * 3, vy: (dy3 / dist3) * 3, isEnemy: true, size: 5, damage: 1 });
        }
      }
    }
  }

  // Move bullets
  s.bullets = s.bullets.filter(b => {
    b.x += b.vx;
    b.y += b.vy;
    return b.y > -20 && b.y < height + 20 && b.x > -20 && b.x < width + 20;
  });

  // Collision: player bullets vs enemies
  const deadEnemies: number[] = [];
  const deadBullets: number[] = [];
  for (let ei = 0; ei < s.enemies.length; ei++) {
    const e = s.enemies[ei];
    for (let bi = 0; bi < s.bullets.length; bi++) {
      const b = s.bullets[bi];
      if (b.isEnemy) continue;
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
        e.hp -= b.damage;
        deadBullets.push(bi);
        if (e.hp <= 0 && !deadEnemies.includes(ei)) deadEnemies.push(ei);
      }
    }
  }
  s.bullets = s.bullets.filter((_, i) => !deadBullets.includes(i));
  for (let i = deadEnemies.length - 1; i >= 0; i--) {
    const e = s.enemies[deadEnemies[i]];
    s.score += e.score;
    if (e.type === 'boss') {
      s.stage++;
      s.stageTimer = 0;
      s.enemies = [];
      s.message = `第 ${s.stage} 关!`;
      if (Math.random() < 0.5) s.items.push({ x: e.x, y: e.y, type: 'power', vy: 1 });
      s.items.push({ x: e.x - 30, y: e.y, type: 'bomb', vy: 1 });
    }
    if (Math.random() < 0.3 && e.type !== 'boss') {
      const types: Item['type'][] = ['power', 'bomb', 'score'];
      s.items.push({ x: e.x, y: e.y, type: types[Math.floor(Math.random() * types.length)], vy: 1.5 });
    }
  }
  s.enemies = s.enemies.filter((_, i) => !deadEnemies.includes(i));

  // Enemy bullets vs player
  if (s.player.invincible <= 0) {
    for (let bi = 0; bi < s.bullets.length; bi++) {
      const b = s.bullets[bi];
      if (!b.isEnemy) continue;
      if (Math.hypot(b.x - s.player.x, b.y - s.player.y) < 8) {
        s.player.hp--;
        s.player.invincible = 30;
        s.bullets.splice(bi, 1);
        bi--;
        if (s.player.hp <= 0) { s.gameOver = true; s.message = 'GAME OVER'; }
        break;
      }
    }
  }

  // Enemy collision with player
  if (s.player.invincible <= 0) {
    for (const e of s.enemies) {
      if (Math.hypot(e.x - s.player.x, e.y - s.player.y) < e.size + 10) {
        s.player.hp -= 2;
        s.player.invincible = 40;
        if (s.player.hp <= 0) { s.gameOver = true; s.message = 'GAME OVER'; }
        break;
      }
    }
  }

  // Items
  s.items = s.items.filter(it => {
    it.y += it.vy;
    if (it.y > height + 30) return false;
    if (Math.hypot(it.x - s.player.x, it.y - s.player.y) < 25) {
      if (it.type === 'power') s.player.power = Math.min(5, s.player.power + 1);
      else if (it.type === 'bomb') s.player.bombs = Math.min(9, s.player.bombs + 1);
      else s.score += 500;
      return false;
    }
    return it.y < height + 30;
  });

  // Clean up enemies off screen
  s.enemies = s.enemies.filter(e => e.y < height + 50);

  return s;
}
