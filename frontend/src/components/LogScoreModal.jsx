import React, { useState } from 'react';

export default function LogScoreModal({ booking, onSubmit, onSkip }) {
  const [playerName, setPlayerName] = useState(booking.customer_name);
  const [score, setScore] = useState('');
  const [won, setWon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ playerName, score: Number(score), won });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,14,23,0.75)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 26, width: 360 }}>
        <h3 style={{ fontSize: 18, marginBottom: 4 }}>Log Session Result</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
          Add this session to the leaderboard for {booking.game_title}.
        </p>

        <div style={{ marginBottom: 12 }}>
          <label>Player / Gamertag</label>
          <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Score</label>
          <input type="number" min="0" value={score} onChange={(e) => setScore(e.target.value)} required autoFocus />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, textTransform: 'none' }}>
          <input type="checkbox" checked={won} onChange={(e) => setWon(e.target.checked)} style={{ width: 'auto' }} />
          <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>Player won this session</span>
        </label>

        {error && <div className="field-error" style={{ marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onSkip}>Skip</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save to Leaderboard'}
          </button>
        </div>
      </form>
    </div>
  );
}
