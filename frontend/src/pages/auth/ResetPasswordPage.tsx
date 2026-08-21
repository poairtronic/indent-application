import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useResetPassword } from '../../api/services/auth';
import { useCapsLock } from '../../hooks/useCapsLock';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    if (!token || resetPasswordMutation.isPending) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    resetPasswordMutation.mutate(
      { token, password: data.password },
      {
        onSuccess: () => {
          setSuccessMsg('Password has been reset successfully! Redirecting to sign in...');
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
    <div className="font-sans w-full space-y-6">
      {/* Top Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] dark:bg-[#6D4AFF]/15 border border-[#DDD6FE] dark:border-[#6D4AFF]/30 flex items-center justify-center text-[#6D4AFF] dark:text-[#8B5CF6] mx-auto shadow-[0_4px_16px_rgba(109,74,255,0.12)] dark:shadow-[0_0_25px_rgba(124,92,252,0.35)]">
          <KeyRound className="w-7 h-7 text-[#6D4AFF] dark:text-[#8B5CF6]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#0B132B] dark:text-white tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1 font-medium">
            Enter and confirm your new secure password
          </p>
        </div>
      </div>

      {successMsg && (
        <div
          className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success text-xs font-semibold flex items-center gap-2"
          role="status"
        >
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs font-semibold flex items-center gap-2"
          role="alert"
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {!token ? (
        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D4AFF] hover:text-[#5B37EB] dark:text-[#8B5CF6] dark:hover:text-[#A78BFA] hover:underline focus:outline-none rounded transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Sign In</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password Input */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-gray-400 mb-1.5">
              NEW PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] dark:text-gray-400 z-10">
                <Lock size={16} />
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                showPasswordToggle={false}
                className="pl-10 pr-10 h-[52px] bg-[#F8FAFC] dark:bg-black/40 border-[#D9DEEA] dark:border-white/15 text-[#0B132B] dark:text-white placeholder-[#94A3B8] dark:placeholder-gray-500 focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 rounded-xl text-sm font-medium transition-all"
                error={errors.password?.message}
                onKeyDown={checkCapsLock}
                onKeyUp={checkCapsLock}
                onBlur={(e) => {
                  handleBlur();
                  passOnBlur(e);
                }}
                {...passRegister}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#6D4AFF] dark:text-gray-400 dark:hover:text-white transition-colors focus:outline-none z-10 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {isCapsLockOn && (
              <div
                className="flex items-center gap-1 text-[11px] font-semibold text-status-warning mt-1.5"
                role="status"
              >
                <AlertTriangle size={13} />
                <span>Caps Lock is ON</span>
              </div>
            )}

            <div className="mt-2.5">
              <PasswordStrengthIndicator password={passwordValue} />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-gray-400 mb-1.5">
              CONFIRM PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] dark:text-gray-400 z-10">
                <Lock size={16} />
              </div>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                showPasswordToggle={false}
                className="pl-10 pr-10 h-[52px] bg-[#F8FAFC] dark:bg-black/40 border-[#D9DEEA] dark:border-white/15 text-[#0B132B] dark:text-white placeholder-[#94A3B8] dark:placeholder-gray-500 focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 rounded-xl text-sm font-medium transition-all"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#6D4AFF] dark:text-gray-400 dark:hover:text-white transition-colors focus:outline-none z-10 cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            loading={resetPasswordMutation.isPending}
            disabled={resetPasswordMutation.isPending}
            fullWidth
            className="h-[52px] text-sm font-bold bg-gradient-to-r from-[#6D4AFF] to-[#7C5CFC] hover:from-[#5E39FF] hover:to-[#6D4AFF] text-white rounded-xl shadow-[0_4px_20px_rgba(109,74,255,0.35)] border-0 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>
              {resetPasswordMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
            </span>
            {!resetPasswordMutation.isPending && <ArrowRight size={16} />}
          </Button>

          {/* Return Link */}
          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D4AFF] hover:text-[#5B37EB] dark:text-[#8B5CF6] dark:hover:text-[#A78BFA] hover:underline focus:outline-none transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetPasswordPage;
