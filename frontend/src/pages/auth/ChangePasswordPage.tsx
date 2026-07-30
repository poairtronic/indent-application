import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { KeyRound, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordFields = z.infer<typeof changePasswordSchema>;

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFields>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFields) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setSuccessMsg('Password updated successfully! Logging out...');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update password. Current password may be incorrect.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Change Password</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Create a new strong password for your account
        </p>
      </div>

      {successMsg && (
        <div className="toast toast-success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="toast toast-error">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label" htmlFor="currentPassword">Current Password</label>
          <input
            id="currentPassword"
            type="password"
            className="form-input"
            placeholder="••••••••"
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <div className="form-error">{errors.currentPassword.message}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            className="form-input"
            placeholder="••••••••"
            {...register('newPassword')}
          />
          {errors.newPassword && <div className="form-error">{errors.newPassword.message}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            type="password"
            className="form-input"
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <div className="form-error">{errors.confirmPassword.message}</div>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ margin: '1.5rem 0' }}>
          {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <KeyRound size={18} />}
          {loading ? 'Updating password...' : 'Update Password'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <Link to="/profile" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={16} /> Back to Profile
          </Link>
        </div>
      </form>
    </div>
  );
};
