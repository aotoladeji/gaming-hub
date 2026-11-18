import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getSession } from '../api/api';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const session = getSession();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    try {
      await api.changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        navigate(session?.admin?.role === 'super_admin' ? '/admin/super' : '/admin/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container" style={{ padding: '60px 24px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Change Password</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Update your account password</p>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label>Current Password</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            required
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>New Password</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
            minLength={8}
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Minimum 8 characters
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>Confirm New Password</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            minLength={8}
          />
        </div>

        {error && (
          <div className="field-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: 12, background: 'rgba(100, 255, 150, 0.1)', border: '1px solid var(--mint)', borderRadius: 8, marginBottom: 16, color: 'var(--mint)' }}>
            Password changed successfully! Redirecting...
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
            Change Password
          </button>
          <Link
            to={session?.admin?.role === 'super_admin' ? '/admin/super' : '/admin/dashboard'}
            className="btn btn-outline"
            style={{ flex: 1, textAlign: 'center' }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
