const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// --- Database ---
const dbPath = path.join(__dirname, 'gamedata.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    coins INTEGER DEFAULT 2000,
    is_guest INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    game_type TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + 'cardgame-salt').digest('hex');
}

function genId() {
  return crypto.randomBytes(8).toString('hex');
}

// --- Auth API ---
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || username.length < 2) return res.status(400).json({ error: '用户名至少2个字符' });
  if (!password || password.length < 4) return res.status(400).json({ error: '密码至少4位' });
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(400).json({ error: '用户名已存在' });
  const id = genId();
  const hash = hashPassword(password);
  db.prepare('INSERT INTO users (id, username, password_hash, coins, is_guest) VALUES (?, ?, ?, 2000, 0)').run(id, username, hash);
  db.prepare('INSERT INTO transactions (user_id, amount, reason) VALUES (?, 2000, ?)').run(id, '注册奖励');
  const user = db.prepare('SELECT id, username, coins, is_guest, created_at FROM users WHERE id = ?').get(id);
  res.json({ user });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const hash = hashPassword(password || '');
  const user = db.prepare('SELECT id, username, coins, is_guest, created_at FROM users WHERE username = ? AND password_hash = ?').get(username, hash);
  if (!user) return res.status(400).json({ error: '用户名或密码错误' });
  res.json({ user });
});

app.post('/api/guest', (req, res) => {
  const id = 'guest_' + genId();
  const username = '游客' + Math.floor(Math.random() * 10000);
  db.prepare('INSERT INTO users (id, username, password_hash, coins, is_guest) VALUES (?, ?, ?, 500, 1)').run(id, username, hashPassword(id));
  db.prepare('INSERT INTO transactions (user_id, amount, reason) VALUES (?, 500, ?)').run(id, '游客试玩金币');
  const user = db.prepare('SELECT id, username, coins, is_guest, created_at FROM users WHERE id = ?').get(id);
  res.json({ user });
});

app.get('/api/user/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, coins, is_guest, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  const txs = db.prepare('SELECT amount, reason, created_at as time FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 30').all(req.params.id);
  res.json({ user, transactions: txs });
});

app.post('/api/coins/add', (req, res) => {
  const { userId, amount, reason } = req.body;
  if (!userId || !amount || amount <= 0) return res.status(400).json({ error: '参数错误' });
  db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(amount, userId);
  db.prepare('INSERT INTO transactions (user_id, amount, reason) VALUES (?, ?, ?)').run(userId, amount, reason || '充值');
  const user = db.prepare('SELECT id, username, coins FROM users WHERE id = ?').get(userId);
  res.json({ user });
});

app.post('/api/coins/spend', (req, res) => {
  const { userId, amount, reason } = req.body;
  if (!userId || !amount || amount <= 0) return res.status(400).json({ error: '参数错误' });
  const u = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId);
  if (!u || u.coins < amount) return res.status(400).json({ error: '金币不足' });
  db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(amount, userId);
  db.prepare('INSERT INTO transactions (user_id, amount, reason) VALUES (?, ?, ?)').run(userId, -amount, reason || '消费');
  const user = db.prepare('SELECT id, username, coins FROM users WHERE id = ?').get(userId);
  res.json({ user });
});

// --- Socket.io ---
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('createRoom', ({ gameType, playerName }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms.set(roomId, { id: roomId, gameType, players: [{ id: socket.id, name: playerName }], state: null });
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
    db.prepare('INSERT INTO rooms (id, game_type, created_by) VALUES (?, ?, ?)').run(roomId, gameType, socket.id);
  });

  socket.on('joinRoom', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    if (!room) { socket.emit('error', { message: '房间不存在' }); return; }
    room.players.push({ id: socket.id, name: playerName });
    socket.join(roomId);
    io.to(roomId).emit('playerJoined', { players: room.players });
  });

  socket.on('gameAction', ({ roomId, action }) => {
    io.to(roomId).emit('gameUpdate', action);
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) rooms.delete(roomId);
      else io.to(roomId).emit('playerLeft', { players: room.players });
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
