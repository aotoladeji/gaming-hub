import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import GameCard from '../components/GameCard';
import Leaderboard from '../components/Leaderboard';

export default function LandingPage() {
  const [gamesData, setGamesData] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getGames()
      .then((data) => {
        setGamesData(data);
        // Expand all categories by default
        const expanded = {};
        Object.keys(data.categorized || {}).forEach(cat => { expanded[cat] = true; });
        setExpandedCategories(expanded);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function toggleCategory(category) {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  }

  const categories = gamesData?.categorized || {};
  const categoryNames = Object.keys(categories);

  return (
    <div>
      {/* --- Nav --- */}
      <header style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'rgba(10,14,23,0.85)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 68 }}>
          <div className="display" style={{ fontSize: 22, letterSpacing: '0.04em' }}>
            ITeMS<span style={{ color: 'var(--violet)' }}> GAMING HUB</span>
          </div>
          <Link to="/manage" className="btn btn-outline btn-sm">Manage Booking</Link>
        </div>
      </header>

      {/* --- Hero --- */}
      <section className="container" style={{ padding: '64px 24px 40px', textAlign: 'center' }}>
        <div className="badge badge-active" style={{ marginBottom: 18 }}>Now open · Book your slot</div>
        <h1 className="display" style={{ fontSize: 'clamp(36px, 6vw, 60px)', lineHeight: 1.05, marginBottom: 16 }}>
          Your session starts<br /><span style={{ color: 'var(--mint)' }}>the moment you check in.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto', fontSize: 16 }}>
          Pick a title, lock in a station, and get a ticket instantly — no queueing at the counter.
        </p>
      </section>

      {/* --- Categorized Games --- */}
      <section className="container" style={{ padding: '20px 24px 60px' }}>
        <h2 style={{ fontSize: 24, marginBottom: 20 }}>Available Games</h2>
        {loading && <div style={{ color: 'var(--text-muted)' }}>Loading games…</div>}
        {error && <div style={{ color: 'var(--red)' }}>{error}</div>}
        
        {!loading && categoryNames.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {categoryNames.map((category) => (
              <div key={category}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleCategory(category)}
                >
                  <h3 style={{ fontSize: 20, margin: 0 }}>
                    {category} <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>({categories[category].length})</span>
                  </h3>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(category);
                    }}
                  >
                    {expandedCategories[category] ? 'Show Less' : 'View All'}
                  </button>
                </div>
                
                {expandedCategories[category] ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                    {categories[category].map((g) => <GameCard key={g.id} game={g} />)}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                    {categories[category].slice(0, 4).map((g) => <GameCard key={g.id} game={g} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- Leaderboard + Contact --- */}
      <section className="container" style={{ padding: '0 24px 80px', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
        <Leaderboard />

        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>Visit the Hub</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: 'var(--text-muted)', fontSize: 14 }}>
            <div><strong style={{ color: 'var(--text)' }}>Address</strong><br />NCC Digital Park, University of Ibadan, Ibadan, Oyo State, Nigeria</div>
            <div><strong style={{ color: 'var(--text)' }}>Hours</strong><br />Mon–Sat · 9:00 AM – 7:00 PM</div>
            <div><strong style={{ color: 'var(--text)' }}>Phone</strong><br />+234 800 000 0000</div>
            <div><strong style={{ color: 'var(--text)' }}>Email</strong><br />hello@itemsgaminghub.com</div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        © {new Date().getFullYear()} ITeMS Gaming Hub. All rights reserved.
      </footer>
    </div>
  );
}
