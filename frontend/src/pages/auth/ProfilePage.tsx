import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../lib/axios';
import {
  User,
  LogOut,
  KeyRound,
  Building2,
  ShieldAlert,
  Award,
  Mail,
  RefreshCw,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await apiClient.get('/auth/profile');
      setProfileData(response.data.data.user);
    } catch {
      setErrorMsg('Failed to load profile from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('auth_refresh_token');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.error('Logout error on server', e);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const displayUser = profileData || user;

  if (!displayUser) return null;

  return (
    <div className="auth-card" style={{ maxWidth: '520px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
          }}
        >
          <User size={30} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            {displayUser.firstName} {displayUser.lastName}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            Emp Code: {displayUser.employeeCode}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="toast toast-error" style={{ marginBottom: '1.5rem' }}>
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'var(--bg-main)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <Mail size={18} style={{ color: 'var(--secondary)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{displayUser.email}</div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'var(--bg-main)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <Building2 size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {displayUser.department?.departmentName || 'N/A'} (
              {displayUser.department?.departmentCode || 'N/A'})
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'var(--bg-main)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <Award size={18} style={{ color: 'var(--success)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {displayUser.role?.roleName || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={fetchProfile}
          disabled={loading}
          className="btn-primary"
          style={{
            flex: 1,
            background: 'none',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
          }}
        >
          <RefreshCw
            size={16}
            style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
          />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>

        <Link to="/change-password" style={{ flex: 1, textDecoration: 'none' }}>
          <button
            className="btn-primary"
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid var(--border-color)',
              color: '#fff',
            }}
          >
            <KeyRound size={16} />
            Password
          </button>
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="btn-primary"
        style={{
          width: '100%',
          marginTop: '1rem',
          background: 'var(--grad-danger)',
        }}
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
};
