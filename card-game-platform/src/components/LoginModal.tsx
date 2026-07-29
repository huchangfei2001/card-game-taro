import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { login, register, playAsGuest } = useUser();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    const fn = mode === 'login' ? login : register;
    const err = await fn(username, password);
    if (err) setError(err);
    else onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        borderRadius: 16, padding: 32, minWidth: 340, maxWidth: 400,
        border: '2px solid #e9c46a', boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }}>
        <h2 style={{ color: '#e9c46a', textAlign: 'center', marginBottom: 20 }}>
          {mode === 'login' ? '登录' : '注册'}
        </h2>

        <div style={{ marginBottom: 12 }}>
          <input value={username} onChange={e => setUsername(e.target.value)}
            placeholder="用户名" style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input value={password} onChange={e => setPassword(e.target.value)}
            placeholder="密码" type="password" style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && <div style={{ color: '#e74c3c', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>{error}</div>}

        <button onClick={handleSubmit} style={{
          width: '100%', padding: 10, fontSize: 16, fontWeight: 700, borderRadius: 8,
          background: 'linear-gradient(135deg, #e9c46a, #f4a261)', color: '#1a1a2e',
          border: 'none', cursor: 'pointer', marginBottom: 10,
        }}>
          {mode === 'login' ? '登录' : '注册（送2000金币）'}
        </button>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
          <span style={{ color: '#aaa', fontSize: 13, cursor: 'pointer' }}
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? '没有账号？注册' : '已有账号？登录'}
          </span>
        </div>

        <div style={{ borderTop: '1px solid #333', paddingTop: 10, textAlign: 'center' }}>
          <button onClick={() => { playAsGuest().then(onClose); }} style={{
            background: 'transparent', color: '#e9c46a', border: '1px solid #e9c46a',
            padding: '8px 24px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
          }}>
            游客试玩（送500金币）
          </button>
        </div>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 15, borderRadius: 8,
  background: '#0d0d1a', border: '1px solid #444', color: '#fff',
  outline: 'none', boxSizing: 'border-box',
};
