import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSession, clearSession } from '../api/api';

export default function AdminNav({ title, showSuperAdminLink = false }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const session = getSession();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 26 }}>{title}</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Signed in as {session?.admin?.full_name} · {session?.admin?.role === 'super_admin' ? 'Super Admin' : 'Staff'}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {showSuperAdminLink && session?.admin?.role === 'super_admin' && (
          <Link to="/admin/super" className="btn btn-outline btn-sm">Super Admin</Link>
        )}
        
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Settings
          </button>
          
          {dropdownOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                minWidth: 180,
                padding: 8,
                zIndex: 100,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <Link
                to="/admin/change-password"
                className="btn-sm"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 12px',
                  borderRadius: 6,
                }}
                onClick={() => setDropdownOpen(false)}
              >
                Change Password
              </Link>
              <button
                className="btn-sm"
                onClick={logout}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 12px',
                  borderRadius: 6,
                  color: 'var(--red)',
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
