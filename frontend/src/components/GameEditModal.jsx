import React, { useState } from 'react';

export default function GameEditModal({ game, onClose, onSave }) {
  const [form, setForm] = useState({
    title: game.title || '',
    console_type: game.console_type || 'PS5 Pro',
    category: game.category || 'Uncategorized',
    price_per_hour: game.price_per_hour || '',
    image_url: game.image_url || '',
    description: game.description || '',
    status: game.status || 'available',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    try {
      await onSave(game.id, {
        ...form,
        price_per_hour: Number(form.price_per_hour)
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, margin: 0 }}>Edit Game</h2>
          <button
            onClick={onClose}
            className="btn-sm"
            style={{ background: 'transparent', border: 'none', fontSize: 24, padding: 0, width: 32, height: 32 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label>Console Type</label>
              <select
                value={form.console_type}
                onChange={(e) => setForm({ ...form, console_type: e.target.value })}
              >
                {['PS5 Pro', 'PS4', 'Xbox Series X', 'Xbox One', 'PC', 'Nintendo Switch', 'Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Sports, Strategy"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label>Price per Hour (₦)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price_per_hour}
                onChange={(e) => setForm({ ...form, price_per_hour: e.target.value })}
                required
              />
            </div>

            <div>
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          <div>
            <label>Image URL</label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Game description..."
              rows={4}
            />
          </div>

          {error && (
            <div className="field-error">{error}</div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ flex: 1 }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
