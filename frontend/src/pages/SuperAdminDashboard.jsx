import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getSession, clearSession } from '../api/api';
import AdminNav from '../components/AdminNav';
import GameEditModal from '../components/GameEditModal';
import DraggableGameList from '../components/DraggableGameList';
import AnalyticsDashboard from './AnalyticsDashboard';

const TABS = ['Analytics', 'Games', 'Charges', 'Staff', 'Transactions'];

const GAME_CATEGORIES = [
  'Uncategorized',
  'Action',
  'Adventure',
  'Casual',
  'Fighting',
  'Puzzle',
  'Racing',
  'Role-Playing',
  'Shooter',
  'Simulation',
  'Sports',
  'Strategy',
];

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState('Analytics');
  const navigate = useNavigate();

  return (
    <div className="container" style={{ padding: '32px 24px 80px' }}>
      <AdminNav title="Super Admin Dashboard" showSuperAdminLink={false} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn-sm"
            style={{
              background: 'transparent', color: tab === t ? 'var(--violet)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--violet)' : '2px solid transparent',
              borderRadius: 0, padding: '10px 6px', fontWeight: 600,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Analytics' && <AnalyticsDashboard />}
      {tab === 'Games' && <GamesPanel />}
      {tab === 'Charges' && <ChargesPanel />}
      {tab === 'Staff' && <StaffPanel />}
      {tab === 'Transactions' && <TransactionsPanel />}
    </div>
  );
}

/* ---------------------------- Games ---------------------------- */
function GamesPanel() {
  const [games, setGames] = useState([]);
  const [form, setForm] = useState({ title: '', console_type: 'PS5 Pro', category: 'Uncategorized', price_per_hour: '', image_url: '', description: '' });
  const [error, setError] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'

  const load = () => api.getGames(true).then((data) => setGames(data.games || [])).catch(() => {});
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function addGame(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createGame({ ...form, price_per_hour: Number(form.price_per_hour) });
      setForm({ title: '', console_type: 'PS5 Pro', category: 'Uncategorized', price_per_hour: '', image_url: '', description: '' });
      load();
    } catch (err) { setError(err.message); }
  }

  async function updatePrice(id, price) {
    await api.updateGame(id, { price_per_hour: Number(price) });
    load();
  }
  
  async function toggleStatus(g) {
    await api.updateGame(g.id, { status: g.status === 'available' ? 'unavailable' : 'available' });
    load();
  }
  
  async function removeGame(id) {
    if (!window.confirm('Delete this game?')) return;
    try { await api.deleteGame(id); load(); } catch (err) { alert(err.message); }
  }

  async function handleEditSave(id, updates) {
    await api.updateGame(id, updates);
    load();
  }

  async function handleReorder(reorderedGames) {
    try {
      console.log('Reordering games:', reorderedGames);
      await api.reorderGames(reorderedGames);
      notify('Games reordered successfully.');
      load();
    } catch (err) {
      console.error('Reorder failed:', err);
      alert('Failed to reorder games: ' + err.message);
      // Reload to reset order
      load();
    }
  }

  function notify(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position: fixed; bottom: 24px; right: 24px; background: var(--surface-raised); border: 1px solid var(--border); padding: 12px 18px; border-radius: 10px; z-index: 1000;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
      <form onSubmit={addGame} className="card" style={{ padding: 20, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 16 }}>Add New Game</h3>
        <div>
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <label>Console</label>
          <select value={form.console_type} onChange={(e) => setForm({ ...form, console_type: e.target.value })}>
            {['PS5 Pro','PS4','Xbox Series X','Xbox One','PC','Nintendo Switch','Other'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {GAME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Price / hour (₦)</label>
          <input type="number" min="0" value={form.price_per_hour} onChange={(e) => setForm({ ...form, price_per_hour: e.target.value })} required />
        </div>
        <div>
          <label>Image URL</label>
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />
        </div>
        <div>
          <label>Description</label>
          <textarea 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            placeholder="Game description..."
            rows={3}
          />
        </div>
        {error && <div className="field-error">{error}</div>}
        <button className="btn btn-primary btn-sm">Add Game</button>
      </form>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, margin: 0 }}>Games List</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('list')}
            >
              Drag to Reorder
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <DraggableGameList
            games={games}
            onReorder={handleReorder}
            onEdit={setEditingGame}
            onToggle={toggleStatus}
            onDelete={removeGame}
          />
        ) : (
          <table>
            <thead><tr><th>Title</th><th>Console</th><th>Category</th><th>Price/hr</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id}>
                  <td>{g.title}</td>
                  <td>{g.console_type}</td>
                  <td>{g.category || 'Uncategorized'}</td>
                  <td>
                    <input
                      type="number" defaultValue={g.price_per_hour} style={{ width: 100 }}
                      onBlur={(e) => e.target.value !== String(g.price_per_hour) && updatePrice(g.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <span className={`badge ${g.status === 'available' ? 'badge-confirmed' : 'badge-cancelled'}`}>{g.status}</span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditingGame(g)}>Edit</button>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(g)}>Toggle</button>
                    <button className="btn btn-danger btn-sm" onClick={() => removeGame(g.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingGame && (
        <GameEditModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

/* ---------------------------- Charges ---------------------------- */
function ChargesPanel() {
  const [charges, setCharges] = useState([]);
  const [form, setForm] = useState({ name: '', amount: '', unit: 'flat' });
  const [error, setError] = useState('');

  const load = () => api.getChargeTypes().then(setCharges).catch(() => {});
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function addCharge(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createChargeType({ ...form, amount: Number(form.amount) });
      setForm({ name: '', amount: '', unit: 'flat' });
      load();
    } catch (err) { setError(err.message); }
  }
  async function remove(id) {
    if (!window.confirm('Delete this charge type?')) return;
    await api.deleteChargeType(id);
    load();
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
      <form onSubmit={addCharge} className="card" style={{ padding: 20, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 16 }}>New Charge Feature</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>e.g. "Extra time in game room" billed per hour, or a flat rental fee.</p>
        <div>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label>Amount (₦)</label>
          <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        </div>
        <div>
          <label>Billing Unit</label>
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="flat">Flat fee</option>
            <option value="per_hour">Per hour</option>
          </select>
        </div>
        {error && <div className="field-error">{error}</div>}
        <button className="btn btn-primary btn-sm">Add Charge</button>
      </form>

      <div className="card" style={{ padding: 20 }}>
        <table>
          <thead><tr><th>Name</th><th>Amount</th><th>Unit</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {charges.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="mono">₦{Number(c.amount).toLocaleString()}</td>
                <td>{c.unit === 'per_hour' ? 'Per hour' : 'Flat'}</td>
                <td><span className={`badge ${c.status === 'active' ? 'badge-confirmed' : 'badge-cancelled'}`}>{c.status}</span></td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------- Staff ---------------------------- */
function StaffPanel() {
  const session = getSession();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ 
    full_name: '', 
    username: '', 
    password: '', 
    role: 'staff',
    permissions: {
      manage_stations: false,
      manage_games: false,
      manage_prices: false
    }
  });
  const [error, setError] = useState('');

  const load = () => api.getStaff().then(setStaff).catch(() => {});
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function addStaff(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      // Only include permissions for staff role
      if (form.role !== 'staff') {
        delete payload.permissions;
      }
      await api.createStaff(payload);
      setForm({ 
        full_name: '', 
        username: '', 
        password: '', 
        role: 'staff',
        permissions: {
          manage_stations: false,
          manage_games: false,
          manage_prices: false
        }
      });
      load();
    } catch (err) { setError(err.message); }
  }
  
  async function toggleStatus(s) {
    await api.updateStaff(s.id, { status: s.status === 'active' ? 'inactive' : 'active' });
    load();
  }
  
  async function remove(id) {
    if (id === session?.admin?.id) return alert('You cannot delete your own account.');
    if (!window.confirm('Remove this staff account?')) return;
    try { await api.deleteStaff(id); load(); } catch (err) { alert(err.message); }
  }

  function handlePermissionChange(permissionKey) {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: !prev.permissions[permissionKey]
      }
    }));
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
      <form onSubmit={addStaff} className="card" style={{ padding: 20, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 16 }}>Add Staff Account</h3>
        <div>
          <label>Full Name</label>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div>
          <label>Username</label>
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div>
          <label>Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="staff">Staff</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        
        {form.role === 'staff' && (
          <div style={{ marginTop: 8 }}>
            <label style={{ marginBottom: 8, display: 'block' }}>Permissions</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--surface)', borderRadius: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.permissions.manage_stations}
                  onChange={() => handlePermissionChange('manage_stations')}
                />
                Manage Stations
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.permissions.manage_games}
                  onChange={() => handlePermissionChange('manage_games')}
                />
                Manage Games
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.permissions.manage_prices}
                  onChange={() => handlePermissionChange('manage_prices')}
                />
                Manage Prices
              </label>
            </div>
          </div>
        )}
        
        {error && <div className="field-error">{error}</div>}
        <button className="btn btn-primary btn-sm">Create Account</button>
      </form>

      <div className="card" style={{ padding: 20 }}>
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Permissions</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {staff.map((s) => {
              const perms = s.permissions ? JSON.parse(s.permissions) : {};
              const permsList = Object.keys(perms).filter(k => perms[k]).map(k => k.replace('manage_', '')).join(', ') || 'None';
              
              return (
                <tr key={s.id}>
                  <td>{s.full_name}</td>
                  <td className="mono">{s.username}</td>
                  <td>{s.role === 'super_admin' ? 'Super Admin' : 'Staff'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {s.role === 'super_admin' ? 'Full Access' : permsList}
                  </td>
                  <td><span className={`badge ${s.status === 'active' ? 'badge-confirmed' : 'badge-cancelled'}`}>{s.status}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(s)}>Toggle</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------- Transactions ---------------------------- */
function TransactionsPanel() {
  const [data, setData] = useState({ transactions: [], total_revenue: 0, count: 0 });

  useEffect(() => { api.getTransactions().then(setData).catch(() => {}); }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Revenue</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>₦{Number(data.total_revenue).toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Transactions</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{data.count}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <table>
          <thead><tr><th>Ticket</th><th>Customer</th><th>Game</th><th>Amount</th><th>Method</th><th>Recorded By</th><th>Date</th></tr></thead>
          <tbody>
            {data.transactions.map((t) => (
              <tr key={t.id}>
                <td className="mono">{t.ticket_number}</td>
                <td>{t.customer_name}</td>
                <td>{t.game_title}</td>
                <td className="mono">₦{Number(t.amount).toLocaleString()}</td>
                <td>{t.payment_method}</td>
                <td>{t.recorded_by_name || '—'}</td>
                <td>{new Date(t.paid_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
