// 指尖弹球引擎 - 画线让小球弹跳到终点

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  start: Point;
  end: Point;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface PinballState {
  ball: Ball;
  lines: Line[];
  startPoint: Point;
  endPoint: Point;
  level: number;
  score: number;
  gameOver: boolean;
  won: boolean;
  paused: boolean;
  drawing: boolean;
  currentLine: Line | null;
  canvasWidth: number;
  canvasHeight: number;
  tickCount: number;
}

const W = 360;
const H = 600;
const BALL_RADIUS = 8;
const GRAVITY = 0.15;
const BOUNCE = 0.7;

export function initPinball(level: number = 1): PinballState {
  const startY = H - 50;
  const endY = 60;
  const endX = Math.random() * (W - 100) + 50;

  return {
    ball: {
      x: 50,
      y: startY,
      vx: 2,
      vy: -3,
      radius: BALL_RADIUS,
    },
    lines: [],
    startPoint: { x: 50, y: startY },
    endPoint: { x: endX, y: endY },
    level,
    score: 0,
    gameOver: false,
    won: false,
    paused: false,
    drawing: false,
    currentLine: null,
    canvasWidth: W,
    canvasHeight: H,
    tickCount: 0,
  };
}

export function startDrawing(state: PinballState, point: Point): PinballState {
  if (state.paused || state.gameOver || state.won) return state;
  return {
    ...state,
    drawing: true,
    currentLine: { start: point, end: point },
  };
}

export function updateDrawing(state: PinballState, point: Point): PinballState {
  if (!state.drawing || !state.currentLine) return state;
  return {
    ...state,
    currentLine: { ...state.currentLine, end: point },
  };
}

export function endDrawing(state: PinballState): PinballState {
  if (!state.drawing || !state.currentLine) return state;

  const line = state.currentLine;
  const length = Math.sqrt(
    Math.pow(line.end.x - line.start.x, 2) +
    Math.pow(line.end.y - line.start.y, 2)
  );

  if (length < 20) {
    return { ...state, drawing: false, currentLine: null };
  }

  return {
    ...state,
    drawing: false,
    lines: [...state.lines, line],
    currentLine: null,
  };
}

function lineIntersection(
  ball: Ball,
  line: Line
): { hit: boolean; nx: number; ny: number } {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { hit: false, nx: 0, ny: 0 };

  const nx = -dy / len;
  const ny = dx / len;

  const px = ball.x - line.start.x;
  const py = ball.y - line.start.y;
  const proj = (px * dx + py * dy) / (len * len);

  if (proj < 0 || proj > 1) return { hit: false, nx: 0, ny: 0 };

  const closestX = line.start.x + proj * dx;
  const closestY = line.start.y + proj * dy;
  const dist = Math.sqrt((ball.x - closestX) ** 2 + (ball.y - closestY) ** 2);

  if (dist < ball.radius + 2) {
    return { hit: true, nx, ny };
  }
  return { hit: false, nx: 0, ny: 0 };
}

export function tickPinball(state: PinballState): PinballState {
  if (state.paused || state.gameOver || state.won) return state;

  let ball = { ...state.ball };
  ball.vy += GRAVITY;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // 边界反弹
  if (ball.x < ball.radius) {
    ball.x = ball.radius;
    ball.vx = -ball.vx * BOUNCE;
  }
  if (ball.x > W - ball.radius) {
    ball.x = W - ball.radius;
    ball.vx = -ball.vx * BOUNCE;
  }
  if (ball.y > H - ball.radius) {
    ball.y = H - ball.radius;
    ball.vy = -ball.vy * BOUNCE;
  }

  // 顶部边界
  if (ball.y < ball.radius) {
    ball.y = ball.radius;
    ball.vy = -ball.vy * BOUNCE;
  }

  // 线碰撞检测
  for (const line of state.lines) {
    const { hit, nx, ny } = lineIntersection(ball, line);
    if (hit) {
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx = (ball.vx - 2 * dot * nx) * BOUNCE;
      ball.vy = (ball.vy - 2 * dot * ny) * BOUNCE;

      const overlap = ball.radius + 2 - Math.sqrt(
        (ball.x - (line.start.x + (line.end.x - line.start.x) * 0.5)) ** 2 +
        (ball.y - (line.start.y + (line.end.y - line.start.y) * 0.5)) ** 2
      );
      if (overlap > 0) {
        ball.x += nx * overlap;
        ball.y += ny * overlap;
      }
    }
  }

  // 检查是否到达终点
  const distToEnd = Math.sqrt(
    (ball.x - state.endPoint.x) ** 2 + (ball.y - state.endPoint.y) ** 2
  );
  if (distToEnd < 30) {
    return {
      ...state,
      ball,
      won: true,
      score: state.score + state.level * 100,
    };
  }

  // 检查是否掉出底部
  if (ball.y > H + 50) {
    return { ...state, ball, gameOver: true };
  }

  return { ...state, ball, tickCount: state.tickCount + 1 };
}

export function clearLines(state: PinballState): PinballState {
  return { ...state, lines: [], score: Math.max(0, state.score - 10) };
}

export function pausePinball(state: PinballState): PinballState {
  return { ...state, paused: !state.paused };
}

export function nextLevel(state: PinballState): PinballState {
  return initPinball(state.level + 1);
}

export function restartPinball(): PinballState {
  return initPinball(1);
}
