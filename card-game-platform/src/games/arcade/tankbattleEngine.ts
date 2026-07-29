// Tank Battle (坦克大战) Engine

export type Tile = 0 | 1 | 2 | 3 | 4; // 0=empty, 1=brick, 2=steel, 3=water, 4=forest
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Tank {
  x: number; y: number; dir: Direction; lives: number; level: number;
  cooldown: number; isAI: boolean; id: number; spawnTimer: number;
  starCount: number; color: string;
}

export interface Bullet { x: number; y: number; dir: Direction; owner: number; }

export interface TankBattleState {
  map: Tile[][];
  tanks: Tank[];
  bullets: Bullet[];
  player: Tank;
  enemiesLeft: number;
  baseAlive: boolean;
  gameOver: boolean;
  score: number;
  level: number;
  message: string;
  powerUps: { x: number; y: number; type: 'star' | 'bomb' | 'timer' | 'shield' | 'life' }[];
}

const MAP_W = 13;
const MAP_H = 13;

const MAPS: Tile[][][] = [
  // Level 1
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,0,0,0,0,0,1,1,0,0],
    [0,0,1,1,0,1,1,1,0,1,1,0,0],
    [0,0,0,0,0,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,0,1,0,0,0,0,0],
    [0,1,1,0,0,0,0,0,0,0,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,0,0,0,0,0,0,0,1,1,0],
    [0,0,0,0,0,1,0,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,0,0,0,0,0],
    [0,0,1,1,0,1,1,1,0,1,1,0,0],
    [0,0,1,1,0,0,0,0,0,1,1,0,0],
    [0,0,0,0,0,0,4,0,0,0,0,0,0],
  ],
  // Level 2
  [
    [0,0,0,0,1,0,0,0,1,0,0,0,0],
    [0,1,1,0,1,0,0,0,1,0,1,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,1,0],
    [0,0,0,1,0,1,0,1,0,1,0,0,0],
    [1,1,0,1,0,0,0,0,0,1,0,1,1],
    [0,0,0,0,0,2,0,2,0,0,0,0,0],
    [0,0,1,0,0,0,0,0,0,0,1,0,0],
    [0,0,0,0,0,2,0,2,0,0,0,0,0],
    [1,1,0,1,0,0,0,0,0,1,0,1,1],
    [0,0,0,1,0,1,0,1,0,1,0,0,0],
    [0,1,0,0,0,0,1,0,0,0,0,1,0],
    [0,1,1,0,1,0,0,0,1,0,1,1,0],
    [0,0,0,0,1,0,4,0,1,0,0,0,0],
  ],
];

const DIR_VEC: Record<Direction, [number, number]> = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
};

const DIR_SEQ: Direction[] = ['up', 'right', 'down', 'left'];

export function initTankBattle(): TankBattleState {
  const m = MAPS[0].map(r => [...r]);
  return {
    map: m, tanks: [], bullets: [],
    player: { x: 4, y: 12, dir: 'up', lives: 3, level: 0, cooldown: 0, isAI: false, id: 0, spawnTimer: 0, starCount: 0, color: '#f0d000' },
    enemiesLeft: 20, baseAlive: true, gameOver: false, score: 0, level: 1,
    message: '坦克大战 - 保卫基地!', powerUps: [],
  };
}

function collidesTank(map: Tile[][], tanks: Tank[], x: number, y: number, selfId: number): boolean {
  if (x < 0.25 || x > MAP_W - 1.25 || y < 0.25 || y > MAP_H - 1.25) return true;
  const cx = Math.round(x), cy = Math.round(y);
  if (cx >= 0 && cx < MAP_W && cy >= 0 && cy < MAP_H && (map[cy][cx] === 1 || map[cy][cx] === 2 || map[cy][cx] === 3)) return true;
  // Tank collision (simplified - check nearby grid)
  return tanks.some(t => t.id !== selfId && t.spawnTimer <= 0 && Math.abs(t.x - x) < 0.9 && Math.abs(t.y - y) < 0.9);
}

export function moveTank(state: TankBattleState, dir: Direction): TankBattleState {
  const p = state.player;
  if (state.gameOver || p.spawnTimer > 0) return state;
  const [dx, dy] = DIR_VEC[dir];
  const nx = p.x + dx * 0.25;
  const ny = p.y + dy * 0.25;
  if (!collidesTank(state.map, state.tanks, nx, ny, p.id)) {
    return { ...state, player: { ...p, x: nx, y: ny, dir } };
  }
  return { ...state, player: { ...p, dir } };
}

export function playerShoot(state: TankBattleState): TankBattleState {
  const p = state.player;
  if (state.gameOver || p.spawnTimer > 0 || p.cooldown > 0) return state;
  const [dx, dy] = DIR_VEC[p.dir];
  const bx = p.x + dx * 0.75;
  const by = p.y + dy * 0.75;
  const bullet: Bullet = { x: bx, y: by, dir: p.dir, owner: p.id };
  let bullets = [...state.bullets, bullet];
  // Limit player bullets
  if (bullets.filter(b => b.owner === p.id).length > 2) return state;
  return { ...state, bullets, player: { ...p, cooldown: 15 } };
}

export function tickTankBattle(state: TankBattleState): TankBattleState {
  let s = { ...state, bullets: [...state.bullets], tanks: [...state.tanks], player: { ...state.player }, powerUps: [...state.powerUps], map: state.map.map(r => [...r]) };

  // Spawn enemies
  if (s.tanks.length < 3 && s.enemiesLeft > 0) {
    const spawns: [number, number][] = [[0, 0], [6, 0], [12, 0]];
    const free = spawns.filter(([sx, sy]) => !s.tanks.some(t => Math.abs(t.x - sx) < 1 && Math.abs(t.y - sy) < 1));
    if (free.length) {
      const [sx, sy] = free[Math.floor(Math.random() * free.length)];
      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
      const tank: Tank = {
        x: sx + 0.5, y: sy + 0.5, dir: 'down', lives: 1, level: 0,
        cooldown: 0, isAI: true, id: Date.now() + Math.random(), spawnTimer: 30,
        starCount: 0, color: colors[Math.floor(Math.random() * colors.length)],
      };
      s.tanks.push(tank);
      s.enemiesLeft--;
    }
  }

  // Tick spawn timers
  s.player.spawnTimer = Math.max(0, s.player.spawnTimer - 1);
  s.tanks = s.tanks.map(t => ({ ...t, spawnTimer: Math.max(0, t.spawnTimer - 1) }));
  s.player.cooldown = Math.max(0, s.player.cooldown - 1);

  // Move bullets
  const newBullets: Bullet[] = [];
  for (const b of s.bullets) {
    const [dx, dy] = DIR_VEC[b.dir];
    const nx = b.x + dx * 0.3;
    const ny = b.y + dy * 0.3;
    if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) continue;
    const cx = Math.round(nx), cy = Math.round(ny);
    // Hit bricks
    if (cx >= 0 && cx < MAP_W && cy >= 0 && cy < MAP_H) {
      if (s.map[cy][cx] === 1) { s.map[cy][cx] = 0; continue; }
      if (s.map[cy][cx] === 2) { if (b.owner === 0 && s.player.level >= 2) s.map[cy][cx] = 0; continue; }
      if (s.map[cy][cx] === 4 && s.map[cy][cx] === 4) continue; // base eagle
      if (cy === MAP_H - 1 && cx === 6) { s.baseAlive = false; s.gameOver = true; s.message = '基地被摧毁!'; continue; }
    }
    // Hit player
    if (b.owner !== 0 && s.player.spawnTimer <= 0) {
      if (Math.abs(s.player.x - nx) < 0.7 && Math.abs(s.player.y - ny) < 0.7) {
        s.player.lives--;
        s.player.spawnTimer = 60;
        s.player.x = 4;
        s.player.y = 12;
        s.player.dir = 'up';
        s.player.starCount = Math.max(0, s.player.starCount - 1);
        s.player.level = Math.max(0, s.player.level - 1);
        if (s.player.lives <= 0) { s.gameOver = true; s.message = '游戏结束!'; }
        continue;
      }
    }
    // Hit AI tanks
    if (b.owner === 0) {
      const hitIdx = s.tanks.findIndex(t => t.spawnTimer <= 0 && Math.abs(t.x - nx) < 0.7 && Math.abs(t.y - ny) < 0.7);
      if (hitIdx >= 0) {
        s.tanks.splice(hitIdx, 1);
        s.score += 100;
        continue;
      }
    }
    newBullets.push({ x: nx, y: ny, dir: b.dir, owner: b.owner });
  }
  s.bullets = newBullets;

  // AI movement & shooting
  for (const t of s.tanks) {
    if (t.spawnTimer > 0) continue;
    const dirs: Direction[] = [];
    if (Math.random() < 0.02) dirs.push(DIR_SEQ[Math.floor(Math.random() * 4)]);
    else {
      // Move toward player
      const dx2 = s.player.x - t.x, dy2 = s.player.y - t.y;
      if (Math.abs(dx2) > Math.abs(dy2)) dirs.push(dx2 > 0 ? 'right' : 'left');
      else dirs.push(dy2 > 0 ? 'down' : 'up');
      if (Math.random() < 0.3) dirs.push(DIR_SEQ[Math.floor(Math.random() * 4)]);
    }
    for (const d of dirs) {
      const [dx2, dy2] = DIR_VEC[d];
      const nx2 = t.x + dx2 * 0.15;
      const ny2 = t.y + dy2 * 0.15;
      const allTanks = [s.player, ...s.tanks];
      if (!collidesTank(s.map, allTanks, nx2, ny2, t.id)) { t.x = nx2; t.y = ny2; t.dir = d; break; }
    }
    // Shoot toward player if aligned
    const aligned = (t.dir === 'up' && s.player.y < t.y && Math.abs(s.player.x - t.x) < 0.5) ||
      (t.dir === 'down' && s.player.y > t.y && Math.abs(s.player.x - t.x) < 0.5) ||
      (t.dir === 'left' && s.player.x < t.x && Math.abs(s.player.y - t.y) < 0.5) ||
      (t.dir === 'right' && s.player.x > t.x && Math.abs(s.player.y - t.y) < 0.5);
    if (aligned && Math.random() < 0.03) {
      const [ddx, ddy] = DIR_VEC[t.dir];
      s.bullets.push({ x: t.x + ddx * 0.75, y: t.y + ddy * 0.75, dir: t.dir, owner: t.id });
    }
  }

  // Random power-up spawn
  if (Math.random() < 0.005 && s.powerUps.length < 2) {
    const types: ('star' | 'bomb' | 'timer' | 'shield' | 'life')[] = ['star', 'bomb', 'timer', 'shield', 'life'];
    s.powerUps.push({
      x: Math.floor(Math.random() * MAP_W),
      y: Math.floor(Math.random() * MAP_H),
      type: types[Math.floor(Math.random() * types.length)]!,
    });
  }

  // Player collects power-ups
  s.powerUps = s.powerUps.filter(pu => {
    if (Math.abs(s.player.x - pu.x - 0.5) < 0.7 && Math.abs(s.player.y - pu.y - 0.5) < 0.7) {
      switch (pu.type) {
        case 'star': s.player.starCount++; s.player.level = Math.min(3, s.player.starCount); break;
        case 'bomb': break; // Kill all enemies
        case 'timer': break; // Freeze enemies
        case 'shield': break;
        case 'life': s.player.lives = Math.min(9, s.player.lives + 1); break;
      }
      return false;
    }
    return true;
  });

  // Level complete
  if (s.enemiesLeft <= 0 && s.tanks.length === 0) {
    const idx = (s.level) % MAPS.length;
    s.level++;
    s.map = MAPS[idx].map(r => [...r]);
    s.enemiesLeft = 10 + s.level * 5;
    s.player.x = 4;
    s.player.y = 12;
    s.player.dir = 'up';
    s.message = `第 ${s.level} 关!`;
    s.tanks = [];
  }

  if (s.baseAlive && !s.gameOver) s.message = `第${s.level}关 生命:${s.player.lives} 分数:${s.score} 剩余:${s.enemiesLeft}`;
  return s;
}
