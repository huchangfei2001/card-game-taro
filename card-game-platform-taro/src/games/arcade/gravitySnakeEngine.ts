// 重力贪吃蛇引擎 - 通过旋转设备改变重力方向

export interface SnakeSegment {
  x: number;
  y: number;
}

export interface GravitySnakeState {
  snake: SnakeSegment[];
  direction: 'up' | 'down' | 'left' | 'right';
  food: { x: number; y: number };
  score: number;
  level: number;
  gameOver: boolean;
  paused: boolean;
  gridWidth: number;
  gridHeight: number;
  gravity: 'up' | 'down' | 'left' | 'right';
  tickCount: number;
}

const W = 15;
const H = 20;

export function initGravitySnake(): GravitySnakeState {
  const snake: SnakeSegment[] = [
    { x: Math.floor(W / 2), y: Math.floor(H / 2) },
    { x: Math.floor(W / 2), y: Math.floor(H / 2) + 1 },
    { x: Math.floor(W / 2), y: Math.floor(H / 2) + 2 },
  ];
  return {
    snake,
    direction: 'up',
    food: spawnFood(snake),
    score: 0,
    level: 1,
    gameOver: false,
    paused: false,
    gridWidth: W,
    gridHeight: H,
    gravity: 'up',
    tickCount: 0,
  };
}

function spawnFood(snake: SnakeSegment[]): { x: number; y: number } {
  let food: { x: number; y: number };
  let valid = false;
  while (!valid) {
    food = {
      x: Math.floor(Math.random() * W),
      y: Math.floor(Math.random() * H),
    };
    valid = !snake.some(s => s.x === food.x && s.y === food.y);
  }
  return food;
}

export function setGravity(state: GravitySnakeState, gravity: 'up' | 'down' | 'left' | 'right'): GravitySnakeState {
  if (state.paused || state.gameOver) return state;
  return { ...state, gravity };
}

export function tickGravitySnake(state: GravitySnakeState): GravitySnakeState {
  if (state.paused || state.gameOver) return state;

  const tickRate = Math.max(5, 15 - state.level);
  if (state.tickCount % tickRate !== 0) {
    return { ...state, tickCount: state.tickCount + 1 };
  }

  const head = state.snake[0];
  let newHead = { ...head };

  switch (state.gravity) {
    case 'up': newHead.y -= 1; break;
    case 'down': newHead.y += 1; break;
    case 'left': newHead.x -= 1; break;
    case 'right': newHead.x += 1; break;
  }

  // 撞墙检测
  if (newHead.x < 0 || newHead.x >= W || newHead.y < 0 || newHead.y >= H) {
    return { ...state, gameOver: true };
  }

  // 撞自己检测（跳过尾巴，因为尾巴会移动）
  for (let i = 0; i < state.snake.length - 1; i++) {
    if (newHead.x === state.snake[i].x && newHead.y === state.snake[i].y) {
      return { ...state, gameOver: true };
    }
  }

  const newSnake = [newHead, ...state.snake];

  // 吃食物
  if (newHead.x === state.food.x && newHead.y === state.food.y) {
    const newScore = state.score + state.level * 10;
    const newLevel = Math.floor(newScore / 100) + 1;
    return {
      ...state,
      snake: newSnake,
      food: spawnFood(newSnake),
      score: newScore,
      level: newLevel,
      tickCount: state.tickCount + 1,
    };
  }

  // 移动（去掉尾巴）
  newSnake.pop();

  return {
    ...state,
    snake: newSnake,
    tickCount: state.tickCount + 1,
  };
}

export function pauseGravitySnake(state: GravitySnakeState): GravitySnakeState {
  return { ...state, paused: !state.paused };
}

export function restartGravitySnake(): GravitySnakeState {
  return initGravitySnake();
}
