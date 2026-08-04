import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useResetPassword } from '../../api/services/auth';
import { useCapsLock } from '../../hooks/useCapsLock';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { ShieldAlert, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
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

  const { isCapsLockOn, checkCapsLock, handleBlur } = useCapsLock();
  const resetPasswordMutation = useResetPassword();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid or missing password reset token. Please request a new link.');
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = useWatch({ control, name: 'password' });

  const onSubmit = (data: ResetPasswordFields) => {
    if (!token) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    resetPasswordMutation.mutate(
      { token, password: data.password },
      {
        onSuccess: () => {
          setSuccessMsg('Password has been reset successfully! Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Failed to reset password. The link may have expired.';
          setErrorMsg(msg);
        },
      },
    );
  };

  const { onBlur: passOnBlur, ...passRegister } = register('password');

  return (
    <div className="auth-card font-sans">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary m-0 mb-2">Reset Password</h2>
        <p className="text-text-muted text-sm m-0">Enter and confirm your new password below</p>
      </div>

      {successMsg && (
        <div className="toast toast-success mb-4" role="status">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="toast toast-error mb-4" role="alert">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {!token ? (
        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-xs font-semibold text-accent-primary hover:underline focus:outline-none focus:ring-1 focus:ring-accent-primary rounded"
          >
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              id="password"
              type="password"
              label="New Password"
              placeholder="••••••••"
              error={errors.password?.message}
              onKeyDown={checkCapsLock}
              onKeyUp={checkCapsLock}
              onBlur={(e) => {
                handleBlur();
                passOnBlur(e);
              }}
              {...passRegister}
            />

            {isCapsLockOn && (
              <div
                className="flex items-center gap-1 text-[11px] font-semibold text-status-warning mt-1"
                role="status"
              >
                <AlertTriangle size={13} />
                <span>Caps Lock is ON</span>
              </div>
            )}

            <PasswordStrengthIndicator password={passwordValue} />
          </div>

          <div className="mt-4">
            <Input
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={resetPasswordMutation.isPending}
            icon={resetPasswordMutation.isPending ? undefined : <ShieldAlert size={16} />}
            fullWidth
            className="mt-6"
          >
            {resetPasswordMutation.isPending ? 'Resetting password...' : 'Reset Password'}
          </Button>
        </form>
      )}
    </div>
  );
};
