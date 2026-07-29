// Puzzle Bobble (泡泡龙) Engine

export interface Bobble {
  color: number; // 0-5
  x: number; y: number;
}

export interface PuzzleBobbleState {
  bubbles: Bobble[][]; // grid: row-major, staggered
  shooter: { x: number; y: number; angle: number; color: number; nextColor: number };
  flying: { x: number; y: number; vx: number; vy: number; color: number } | null;
  score: number;
  gameOver: boolean;
  message: string;
  ceiling: number; // how far down the ceiling has moved
}

const COLS = 8;
const ROWS = 12;
const BUBBLE_R = 18;
const COLORS_COUNT = 6;

export function initPuzzleBobble(): PuzzleBobbleState {
  const bubbles: Bobble[][] = [];
  // Initial rows
  for (let r = 0; r < 4; r++) {
    const row: Bobble[] = [];
    const numCols = r % 2 === 0 ? COLS : COLS - 1;
    for (let c = 0; c < numCols; c++) {
      row.push({ color: Math.floor(Math.random() * COLORS_COUNT), x: 0, y: 0 });
    }
    bubbles.push(row);
  }
  return {
    bubbles, shooter: { x: 0, y: 0, angle: 0, color: Math.floor(Math.random() * COLORS_COUNT), nextColor: Math.floor(Math.random() * COLORS_COUNT) },
    flying: null, score: 0, gameOver: false, message: '泡泡龙 - 发射匹配的泡泡!', ceiling: 0,
  };
}

function getBubblePos(row: number, col: number, offsetX: number, offsetY: number): { x: number; y: number } {
  const isOdd = row % 2 === 1;
  const x = offsetX + col * BUBBLE_R * 2 + BUBBLE_R + (isOdd ? BUBBLE_R : 0);
  const y = offsetY + row * BUBBLE_R * Math.sqrt(3) + BUBBLE_R;
  return { x, y };
}

export function setAngle(state: PuzzleBobbleState, angle: number): PuzzleBobbleState {
  if (state.flying || state.gameOver) return state;
  return { ...state, shooter: { ...state.shooter, angle } };
}

export function shootBobble(state: PuzzleBobbleState): PuzzleBobbleState {
  if (state.flying || state.gameOver) return state;
  const { shooter } = state;
  const speed = 8;
  const vx = Math.cos(shooter.angle) * speed;
  const vy = Math.sin(shooter.angle) * speed;
  return { ...state, flying: { x: shooter.x, y: shooter.y, vx, vy, color: shooter.color } };
}

export function tickPuzzleBobble(state: PuzzleBobbleState, canvasW: number, canvasH: number): PuzzleBobbleState {
  let s = { ...state, bubbles: state.bubbles.map(r => r.map(b => ({ ...b }))) };
  const offsetX = (canvasW - COLS * BUBBLE_R * 2) / 2;
  const offsetY = 40;

  if (!s.flying) return s;

  let { x, y, vx, vy, color } = s.flying;
  x += vx;
  y += vy;

  // Wall bounce
  if (x < BUBBLE_R) { x = BUBBLE_R; vx = Math.abs(vx); }
  if (x > canvasW - BUBBLE_R) { x = canvasW - BUBBLE_R; vx = -Math.abs(vx); }

  // Ceiling collision
  if (y < offsetY + BUBBLE_R) {
    return snapBubble(s, x, offsetY, color, offsetX, offsetY);
  }

  // Bubble collision
  for (let r = 0; r < s.bubbles.length; r++) {
    const row = s.bubbles[r];
    for (let c = 0; c < row.length; c++) {
      const pos = getBubblePos(r, c, offsetX, offsetY);
      const dist = Math.hypot(x - pos.x, y - pos.y);
      if (dist < BUBBLE_R * 1.9) {
        return snapBubble(s, pos.x, pos.y, color, offsetX, offsetY);
      }
    }
  }

  // Bottom collision
  if (y > canvasH - BUBBLE_R * 2) {
    return snapBubble(s, x, canvasH - BUBBLE_R * 2, color, offsetX, offsetY);
  }

  return { ...state, flying: { x, y, vx, vy, color } };
}

function snapBubble(state: PuzzleBobbleState, x: number, y: number, color: number, offsetX: number, offsetY: number): PuzzleBobbleState {
  // Find nearest grid position
  let bestRow = -1, bestCol = -1, bestDist = Infinity;
  const maxRow = ROWS;
  for (let r = 0; r < maxRow; r++) {
    const numCols = r % 2 === 0 ? COLS : COLS - 1;
    for (let c = 0; c < numCols; c++) {
      // Check if this spot is free
      const exists = r < state.bubbles.length && c < state.bubbles[r].length;
      if (exists) continue;
      const pos = getBubblePos(r, c, offsetX, offsetY);
      const d = Math.hypot(x - pos.x, y - pos.y);
      if (d < bestDist) { bestDist = d; bestRow = r; bestCol = c; }
    }
  }

  if (bestRow < 0) return state;

  // Add bubble to grid
  const newBubbles = state.bubbles.map(r => r.map(b => ({ ...b })));
  while (newBubbles.length <= bestRow) newBubbles.push([]);
  const row = newBubbles[bestRow];
  row.splice(bestCol, 0, { color, x: 0, y: 0 });

  // Check matches
  const toRemove = findMatches(newBubbles, bestRow, bestCol, color);
  let score = state.score;

  if (toRemove.size >= 3) {
    score += toRemove.size * 10;
    for (const key of toRemove) {
      const [r, c] = key.split(',').map(Number);
      newBubbles[r][c] = { color: -1, x: 0, y: 0 }; // mark for removal
    }
    // Remove marked
    for (let r = newBubbles.length - 1; r >= 0; r--) {
      newBubbles[r] = newBubbles[r].filter(b => b.color >= 0);
      if (newBubbles[r].length === 0) newBubbles.splice(r, 1);
    }
    // Find floating
    const floating = findFloating(newBubbles);
    floating.forEach(([r, c]) => { newBubbles[r][c] = { color: -1, x: 0, y: 0 }; });
    score += floating.length * 15;
    for (let r = newBubbles.length - 1; r >= 0; r--) {
      newBubbles[r] = newBubbles[r].filter(b => b.color >= 0);
      if (newBubbles[r].length === 0) newBubbles.splice(r, 1);
    }
  }

  // Game over check
  const gameOver = newBubbles.length > ROWS;
  const nextColor = Math.floor(Math.random() * COLORS_COUNT);

  return {
    ...state, bubbles: newBubbles, flying: null, score,
    shooter: { ...state.shooter, color: state.shooter.nextColor, nextColor },
    gameOver, message: gameOver ? '游戏结束!' : `分数: ${score}`,
  };
}

function findMatches(bubbles: Bobble[][], row: number, col: number, color: number): Set<string> {
  const visited = new Set<string>();
  const toVisit = [`${row},${col}`];
  visited.add(toVisit[0]);

  while (toVisit.length > 0) {
    const key = toVisit.pop()!;
    const [r, c] = key.split(',').map(Number);

    const neighbors = getNeighbors(r, c, bubbles[r].length, bubbles.length);
    for (const [nr, nc] of neighbors) {
      const nkey = `${nr},${nc}`;
      if (!visited.has(nkey) && bubbles[nr]?.[nc]?.color === color) {
        visited.add(nkey);
        toVisit.push(nkey);
      }
    }
  }
  return visited;
}

function getNeighbors(r: number, c: number, rowLen: number, totalRows: number): [number, number][] {
  const isOdd = r % 2 === 1;
  const neighbors: [number, number][] = [];
  // Same row
  if (c > 0) neighbors.push([r, c - 1]);
  if (c < rowLen - 1) neighbors.push([r, c + 1]);
  // Row above
  if (r > 0 && r - 1 < totalRows) {
    if (isOdd) { neighbors.push([r-1, c], [r-1, c+1]); }
    else { if (c > 0) neighbors.push([r-1, c-1]); neighbors.push([r-1, c]); }
  }
  // Row below
  if (r + 1 < totalRows) {
    if (isOdd) { neighbors.push([r+1, c], [r+1, c+1]); }
    else { if (c > 0) neighbors.push([r+1, c-1]); neighbors.push([r+1, c]); }
  }
  return neighbors.filter(([nr, nc]) => nr >= 0 && nr < totalRows && nc >= 0);
}

function findFloating(bubbles: Bobble[][]): [number, number][] {
  // BFS from top row - connected bubbles stay
  const connected = new Set<string>();
  const queue: [number, number][] = [];
  for (let r = 0; r < bubbles.length; r++) {
    for (let c = 0; c < bubbles[r].length; c++) {
      if (bubbles[r][c] && bubbles[r][c].color >= 0 && r === 0 && !connected.has(`${r},${c}`)) {
        connected.add(`${r},${c}`);
        queue.push([r, c]);
      }
    }
  }
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const [nr, nc] of getNeighbors(r, c, bubbles[r].length, bubbles.length)) {
      const key = `${nr},${nc}`;
      if (!connected.has(key) && bubbles[nr]?.[nc]?.color >= 0) {
        connected.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  // All non-connected are floating
  const floating: [number, number][] = [];
  for (let r = 0; r < bubbles.length; r++) {
    for (let c = 0; c < bubbles[r].length; c++) {
      if (bubbles[r][c] && bubbles[r][c].color >= 0 && !connected.has(`${r},${c}`)) {
        floating.push([r, c]);
      }
    }
  }
  return floating;
}
