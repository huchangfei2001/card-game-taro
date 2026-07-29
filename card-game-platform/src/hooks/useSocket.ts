import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [gameAction, setGameAction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('roomCreated', ({ roomId: rid }) => setRoomId(rid));
    socket.on('playerJoined', ({ players: p }) => setPlayers(p));
    socket.on('playerLeft', ({ players: p }) => setPlayers(p));
    socket.on('gameUpdate', (action) => setGameAction(action));
    socket.on('error', ({ message }) => setError(message));

    return () => { socket.disconnect(); };
  }, []);

  const createRoom = useCallback((gameType: string, playerName: string) => {
    setError(null);
    socketRef.current?.emit('createRoom', { gameType, playerName });
  }, []);

  const joinRoom = useCallback((rid: string, playerName: string) => {
    setError(null);
    socketRef.current?.emit('joinRoom', { roomId: rid, playerName });
  }, []);

  const sendAction = useCallback((action: any) => {
    if (roomId) {
      socketRef.current?.emit('gameAction', { roomId, action });
    }
  }, [roomId]);

  return { connected, roomId, players, gameAction, error, createRoom, joinRoom, sendAction };
}
