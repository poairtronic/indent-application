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
import { Button } from '../../components/ui/Button';

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
    <div className="auth-card max-w-[520px]">
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-white"
          style={{ background: 'var(--grad-primary)' }}
        >
          <User size={30} />
        </div>
        <div>
          <h2 className="text-xl font-bold m-0">
            {displayUser.firstName} {displayUser.lastName}
          </h2>
          <p className="text-text-muted text-sm m-0 mt-1">Emp Code: {displayUser.employeeCode}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="toast toast-error mb-6">
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-3 p-3 bg-background-primary rounded-lg border border-border-default">
          <Mail size={18} className="text-secondary" />
          <div>
            <div className="text-xs text-text-muted">Email</div>
            <div className="text-sm font-medium">{displayUser.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-background-primary rounded-lg border border-border-default">
          <Building2 size={18} className="text-accent-primary" />
          <div>
            <div className="text-xs text-text-muted">Department</div>
            <div className="text-sm font-medium">
              {displayUser.department?.departmentName || 'N/A'} (
              {displayUser.department?.departmentCode || 'N/A'})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-background-primary rounded-lg border border-border-default">
          <Award size={18} className="text-status-success" />
          <div>
            <div className="text-xs text-text-muted">Role</div>
            <div className="text-sm font-medium">{displayUser.role?.roleName || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={fetchProfile}
          loading={loading}
          icon={loading ? undefined : <RefreshCw size={16} />}
          fullWidth
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>

        <Link to="/change-password" className="flex-1 no-underline">
          <Button variant="outline" fullWidth icon={<KeyRound size={16} />}>
            Password
          </Button>
        </Link>
      </div>

      <Button
        variant="danger"
        onClick={handleLogout}
        fullWidth
        icon={<LogOut size={16} />}
        className="mt-4"
      >
        Sign Out
      </Button>
    </div>
  );
};
