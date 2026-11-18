import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import Leaderboard from '../components/Leaderboard';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--red)' }}>
        Failed to load analytics data
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Revenue Trend */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 20, marginBottom: 20 }}>💰 Revenue Trend (Last 7 Days)</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Bookings</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {analytics.revenue_trend.map((day) => (
              <tr key={day.date}>
                <td>{new Date(day.date).toLocaleDateString()}</td>
                <td>{day.bookings}</td>
                <td className="mono">₦{Number(day.revenue).toLocaleString()}</td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
              <td>Total</td>
              <td>{analytics.revenue_trend.reduce((sum, d) => sum + parseInt(d.bookings), 0)}</td>
              <td className="mono" style={{ color: 'var(--mint)' }}>
                ₦{analytics.revenue_trend.reduce((sum, d) => sum + parseFloat(d.revenue), 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Console & Category Popularity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 20 }}>🎯 Console Type Popularity</h3>
          {analytics.console_popularity.map((console, idx) => {
            const total = analytics.console_popularity.reduce((sum, c) => sum + parseInt(c.bookings), 0);
            const percentage = ((console.bookings / total) * 100).toFixed(1);
            
            return (
              <div key={console.console_type} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{console.console_type}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{percentage}%</span>
                </div>
                <div style={{ background: 'var(--surface)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      background: `hsl(${idx * 60}, 70%, 60%)`,
                      height: '100%',
                      width: `${percentage}%`,
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {console.bookings} bookings • ₦{Number(console.revenue).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 20 }}>📂 Category Popularity</h3>
          {analytics.category_popularity.map((category, idx) => {
            const total = analytics.category_popularity.reduce((sum, c) => sum + parseInt(c.bookings), 0);
            const percentage = ((category.bookings / total) * 100).toFixed(1);
            
            return (
              <div key={category.category} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{category.category}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{percentage}%</span>
                </div>
                <div style={{ background: 'var(--surface)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      background: `hsl(${idx * 80}, 60%, 55%)`,
                      height: '100%',
                      width: `${percentage}%`,
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {category.bookings} bookings • ₦{Number(category.revenue).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Station Utilization */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 20, marginBottom: 20 }}>🏢 Station Utilization</h3>
        <table>
          <thead>
            <tr>
              <th>Station</th>
              <th>Console Type</th>
              <th>Total Sessions</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {analytics.station_utilization.map((station) => (
              <tr key={station.id}>
                <td>{station.name}</td>
                <td>{station.console_type}</td>
                <td>{station.total_sessions || 0}</td>
                <td className="mono">{Number(station.total_hours || 0).toFixed(1)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Customers */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 20, marginBottom: 20 }}>👥 Top Customers</h3>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Customer</th>
              <th>Contact</th>
              <th>Bookings</th>
              <th>Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {analytics.top_customers.slice(0, 10).map((customer, idx) => (
              <tr key={idx}>
                <td>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: idx < 3 ? 'var(--violet)' : 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14
                  }}>
                    {idx + 1}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{customer.customer_name}</td>
                <td>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {customer.phone_number}
                    {customer.customer_email && <><br />{customer.customer_email}</>}
                  </div>
                </td>
                <td>{customer.total_bookings}</td>
                <td className="mono" style={{ color: 'var(--mint)', fontWeight: 600 }}>
                  ₦{Number(customer.total_spent).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leaderboard */}
      <div>
        <h3 style={{ fontSize: 20, marginBottom: 16 }}>🏆 Global Leaderboard</h3>
        <Leaderboard />
      </div>

      {/* Booking Status Breakdown */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 20, marginBottom: 20 }}>📋 Booking Status Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {analytics.status_breakdown.map((status) => (
            <div key={status.status} className="card" style={{ padding: 16, background: 'var(--surface)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                {status.status}
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{status.count}</div>
              <div className="mono" style={{ fontSize: 14, color: 'var(--mint)' }}>
                ₦{Number(status.total_value).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Played Games */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 20, marginBottom: 20 }}>🎮 Most Played Games</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {analytics.most_played_games.slice(0, 10).map((game, idx) => (
            <div
              key={game.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                background: 'var(--surface)',
                borderRadius: 8,
                borderLeft: `4px solid ${idx === 0 ? '#7c5cff' : idx === 1 ? '#00e6b8' : '#3b82f6'}`
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{game.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {game.console_type} • {game.category}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--violet)' }}>
                  {game.play_count}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>plays</div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 24 }}>
                <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--mint)' }}>
                  ₦{Number(game.total_revenue).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>revenue</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
