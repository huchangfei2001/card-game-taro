// Pac-Man Engine

export type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PacManState {
  map: number[][];
  pacman: { x: number; y: number; dir: Direction; nextDir: Direction; mouth: number };
  ghosts: { name: GhostName; x: number; y: number; dir: Direction; mode: 'chase' | 'scatter' | 'frightened'; timer: number; col: number; row: number }[];
  dots: boolean[][];
  powerPellets: boolean[][];
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  message: string;
  ghostTimer: number;
  frightenedTimer: number;
  dotsEaten: number;
  ghostEatenCombo: number;
}

const H = 31, W = 28;

// 0=wall, 1=dot path, 2=empty, 3=ghost house
const MAZE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,2,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,2,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,2,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0],
  [2,2,2,2,2,0,1,0,0,0,0,0,2,0,0,2,0,0,0,0,0,1,0,2,2,2,2,2],
  [2,2,2,2,2,0,1,0,0,2,2,2,2,2,2,2,2,2,2,0,0,1,0,2,2,2,2,2],
  [2,2,2,2,2,0,1,0,0,2,0,0,0,3,3,0,0,0,2,0,0,1,0,2,2,2,2,2],
  [0,0,0,0,0,0,1,0,0,2,0,3,3,3,3,3,3,0,2,0,0,1,0,0,0,0,0,0],
  [2,2,2,2,2,2,1,2,2,2,0,3,3,3,3,3,3,0,2,2,2,1,2,2,2,2,2,2],
  [0,0,0,0,0,0,1,0,0,2,0,3,3,3,3,3,3,0,2,0,0,1,0,0,0,0,0,0],
  [2,2,2,2,2,0,1,0,0,2,0,0,0,0,0,0,0,0,2,0,0,1,0,2,2,2,2,2],
  [2,2,2,2,2,0,1,0,0,2,2,2,2,2,2,2,2,2,2,0,0,1,0,2,2,2,2,2],
  [2,2,2,2,2,0,1,0,0,2,0,0,0,0,0,0,0,0,2,0,0,1,0,2,2,2,2,2],
  [0,0,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,2,0,0,1,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,2,1,1,0,0,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,0,0,1,1,2,0],
  [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
  [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const POWER_PELLET_POS = [[1,3],[1,23],[26,3],[26,23]];

const DIRS: Record<Direction, [number, number]> = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
};

function isWall(map: number[][], x: number, y: number): boolean {
  return map[y]?.[x] !== 1 && map[y]?.[x] !== 2 && map[y]?.[x] !== 3;
}

export function initPacman(): PacManState {
  const map = MAZE.map(r => [...r]);
  const dots: boolean[][] = initDots();
  const powerPellets: boolean[][] = Array.from({ length: H }, () =>
    Array(W).fill(false));
  for (const [r, c] of POWER_PELLET_POS) powerPellets[r][c] = true;

  return {
    map, pacman: { x: 13, y: 23, dir: 'left', nextDir: 'left', mouth: 0 },
    ghosts: [
      { name: 'blinky', x: 13, y: 11, dir: 'up', mode: 'scatter', timer: 0, col: 13, row: 11 },
      { name: 'pinky', x: 12, y: 14, dir: 'up', mode: 'scatter', timer: 0, col: 12, row: 14 },
      { name: 'inky', x: 14, y: 14, dir: 'up', mode: 'scatter', timer: 0, col: 14, row: 14 },
      { name: 'clyde', x: 13, y: 13, dir: 'up', mode: 'scatter', timer: 0, col: 13, row: 13 },
    ],
    dots, powerPellets, score: 0, lives: 3, level: 1, gameOver: false,
    message: '吃豆人 - 吃掉所有豆子!', ghostTimer: 0, frightenedTimer: 0,
    dotsEaten: 0, ghostEatenCombo: 0,
  };
}

function initDots(): boolean[][] {
  const dots: boolean[][] = Array(H).fill(null).map(() => Array(W).fill(false));
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (MAZE[r][c] === 1) dots[r][c] = true;
    }
  }
  return dots;
}

export function setPacmanDir(state: PacManState, dir: Direction): PacManState {
  return { ...state, pacman: { ...state.pacman, nextDir: dir } };
}

export function tickPacman(state: PacManState): PacManState {
  const s = { ...state, pacman: { ...state.pacman }, ghosts: state.ghosts.map(g => ({ ...g })) };
  if (s.gameOver) return s;

  const p = s.pacman;
  const speed = 0.15 + s.level * 0.02;

  // Try next direction
  const [ndx, ndy] = DIRS[p.nextDir];
  const nx2 = p.x + ndx * speed;
  const ny2 = p.y + ndy * speed;
  const gridX = Math.round(nx2), gridY = Math.round(ny2);
  if (!isWall(s.map, gridX, gridY)) {
    p.dir = p.nextDir;
  }

  // Move current direction
  const [dx, dy] = DIRS[p.dir];
  const nx = p.x + dx * speed;
  const ny = p.y + dy * speed;
  const gx = Math.round(nx), gy = Math.round(ny);
  if (!isWall(s.map, gx, gy)) {
    p.x = nx; p.y = ny;
  } else {
    // Align to grid
    p.x = Math.round(p.x);
    p.y = Math.round(p.y);
  }

  // Tunnel wrap
  if (p.x < -1) p.x = W;
  if (p.x > W + 1) p.x = -1;

  // Mouth animation
  p.mouth = (p.mouth + 0.15) % 1;

  // Eat dots
  const pr = Math.round(p.y), pc = Math.round(p.x);
  if (s.dots[pr]?.[pc]) { s.dots[pr][pc] = false; s.score += 10; s.dotsEaten++; }
  if (s.powerPellets[pr]?.[pc]) {
    s.powerPellets[pr][pc] = false;
    s.score += 50;
    s.frightenedTimer = 300;
    s.ghostEatenCombo = 0;
    s.ghosts.forEach(g => { g.mode = 'frightened'; });
  }

  // Ghost mode timer
  s.ghostTimer++;
  if (s.frightenedTimer > 0) {
    s.frightenedTimer--;
    if (s.frightenedTimer === 0) {
      s.ghosts.forEach(g => { if (g.mode === 'frightened') g.mode = 'scatter'; });
    }
  } else {
    // Scatter/chase cycle
    if (s.ghostTimer < 420) { s.ghosts.forEach(g => { if (g.mode !== 'frightened') g.mode = 'scatter'; }); }
    else if (s.ghostTimer < 1260) { s.ghosts.forEach(g => { if (g.mode !== 'frightened') g.mode = 'chase'; }); }
    else { s.ghostTimer = 0; }
  }

  // Move ghosts
  for (const g of s.ghosts) {
    const gSpeed = g.mode === 'frightened' ? speed * 0.5 : speed * 0.85;
    let targetX = 0, targetY = 0;
    if (g.mode === 'scatter') {
      const corners: Record<GhostName, [number,number]> = { blinky: [25,0], pinky: [2,0], inky: [27,30], clyde: [0,30] };
      [targetX, targetY] = corners[g.name];
    } else if (g.mode === 'chase') {
      switch (g.name) {
        case 'blinky': targetX = p.x; targetY = p.y; break;
        case 'pinky': { const [ttx, tty] = DIRS[p.dir]; targetX = p.x + ttx * 4; targetY = p.y + tty * 4; break; }
        case 'inky': {
          const [ttx, tty] = DIRS[p.dir];
          const ax = p.x + ttx * 2, ay = p.y + tty * 2;
          const bx = s.ghosts.find(v => v.name==='blinky')!.x, by = s.ghosts.find(v => v.name==='blinky')!.y;
          targetX = bx + (ax - bx) * 2; targetY = by + (ay - by) * 2;
          break;
        }
        case 'clyde':
          if (Math.hypot(g.x - p.x, g.y - p.y) < 8) { const c: [number,number] = [0,30]; targetX = c[0]; targetY = c[1]; }
          else { targetX = p.x; targetY = p.y; }
          break;
      }
    } else {
      // Random for frightened
      targetX = Math.random() * W;
      targetY = Math.random() * H;
    }

    // Choose direction at grid intersection toward target
    const gx2 = Math.round(g.x), gy = Math.round(g.y);
    if (Math.abs(g.x - gx2) < 0.1 && Math.abs(g.y - gy) < 0.1) {
      g.x = gx2; g.y = gy;
      const possible: Direction[] = [];
      for (const d of ['up','down','left','right'] as Direction[]) {
        const [ddx, ddy] = DIRS[d];
        if (g.mode !== 'frightened' || d !== oppositeDir(g.dir)) {
          if (!isWall(s.map, gx2 + ddx, gy + ddy)) possible.push(d);
        }
      }
      // Don't reverse unless frightened
      if (possible.length === 0) {
        for (const d of ['up','down','left','right'] as Direction[]) {
          if (d === oppositeDir(g.dir)) { possible.push(d); break; }
        }
      }
      if (possible.length > 0) {
        let best: Direction = possible[0];
        let bestDist = Infinity;
        for (const d of possible) {
          const [ddx, ddy] = DIRS[d];
          const dist = Math.hypot(gx2 + ddx - targetX, gy + ddy - targetY);
          if (dist < bestDist) { bestDist = dist; best = d; }
        }
        g.dir = best;
      }
    }

    const [gdx, gdy] = DIRS[g.dir];
    const gnx = g.x + gdx * gSpeed, gny = g.y + gdy * gSpeed;
    if (!isWall(s.map, Math.round(gnx), Math.round(gny))) { g.x = gnx; g.y = gny; }
  }

  // Pac-Man vs ghost collision
  for (const g of s.ghosts) {
    if (Math.abs(g.x - p.x) < 0.7 && Math.abs(g.y - p.y) < 0.7) {
      if (g.mode === 'frightened') {
        s.ghostEatenCombo++;
        s.score += 200 * s.ghostEatenCombo;
        // Reset ghost to house
        g.x = 13; g.y = 11;
      } else {
        s.lives--;
        if (s.lives <= 0) { s.gameOver = true; s.message = '游戏结束!'; }
        else { s.message = `生命-1 (剩余${s.lives})`; }
        // Reset positions
        s.pacman.x = 13; s.pacman.y = 23; s.pacman.dir = 'left';
        s.ghosts.forEach(gh => { gh.x = 13; gh.y = 11; });
        s.frightenedTimer = 0;
        break;
      }
    }
  }

  // Win check
  const remaining = s.dots.flat().filter(Boolean).length + s.powerPellets.flat().filter(Boolean).length;
  if (remaining === 0) {
    s.level++;
    s.dots = initDots();
    s.powerPellets = Array(H).fill(null).map(() => Array(W).fill(false));
    for (const [r, c] of POWER_PELLET_POS) s.powerPellets[r][c] = true;
    s.pacman.x = 13; s.pacman.y = 23;
    s.ghosts.forEach(g => { g.x = 13; g.y = 11; });
    s.message = `第 ${s.level} 关! 分数: ${s.score}`;
  }

  return s;
}

function oppositeDir(d: Direction): Direction {
  const map: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
  return map[d];
}
