import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../../lib/axios';
import { ShieldAlert, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid or missing password reset token.');
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFields) => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: data.password,
      });

      setSuccessMsg('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold m-0 mb-2">Reset Password</h2>
        <p className="text-text-muted text-sm m-0">Enter and confirm your new password below</p>
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

      {!token ? (
        <div className="text-center mt-4">
          <Link to="/login" className="auth-link">
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            id="password"
            type="password"
            label="New Password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={loading ? undefined : <ShieldAlert size={16} />}
            fullWidth
            className="mt-6"
          >
            {loading ? 'Resetting password...' : 'Reset Password'}
          </Button>
        </form>
      )}
    </div>
  );
};
