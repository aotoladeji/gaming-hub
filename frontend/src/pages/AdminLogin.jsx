import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveSession } from '../api/api';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, admin } = await api.login(username, password);
      saveSession(token, admin);
      navigate(admin.role === 'super_admin' ? '/admin/super' : '/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 32, width: 360 }}>
        <div className="display" style={{ fontSize: 22, marginBottom: 4 }}>ITeMS<span style={{ color: 'var(--violet)' }}> GAMING HUB</span></div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Staff & Admin sign-in</p>

        <div style={{ marginBottom: 14 }}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <div className="field-error" style={{ marginBottom: 16 }}>{error}</div>}

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
