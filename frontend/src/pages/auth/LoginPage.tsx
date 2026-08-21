import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../../api/services/auth';
import { useCapsLock } from '../../hooks/useCapsLock';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const REMEMBER_ME_KEY = 'imcms_remembered_email';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  rememberMe: z.boolean().optional(),
});

type LoginFields = z.infer<typeof loginSchema>;

function getLoginErrorMessage(error: unknown): string {
  const err = error as any;

  if (err.response?.data?.message && typeof err.response.data.message === 'string') {
    return err.response.data.message;
  }

  if (err.message && err.status) {
    if (err.status === 401) return err.message;
    if (err.status === 400) return err.message;
    if (err.status === 403) return 'Access denied. You do not have permission.';
    if (err.status >= 500)
      return 'The server encountered an error while signing you in. Please try again.';
  }

  if (err.code === 'NETWORK_ERROR' || err.code === 'ERR_NETWORK') {
    return 'Unable to reach the server. Make sure the backend is running and try again.';
  }

  return 'Login failed. Please check your credentials and try again.';
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isCapsLockOn, checkCapsLock, handleBlur } = useCapsLock();
  const loginMutation = useLogin();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savedEmail = localStorage.getItem(REMEMBER_ME_KEY) || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: savedEmail,
      password: '',
      rememberMe: Boolean(savedEmail),
    },
  });

  const onSubmit = async (data: LoginFields) => {
    if (isSubmitting || loginMutation.isPending) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (data.rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, data.email);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }

    try {
      await loginMutation.mutateAsync({ email: data.email, password: data.password });
      setSuccessMsg('Login Successful! Redirecting...');
      setIsSubmitting(false);

      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl');
      const targetPath = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
      navigate(targetPath, { replace: true });
    } catch (error: unknown) {
      setIsSubmitting(false);
      const message = getLoginErrorMessage(error);
      setErrorMsg(message);

      if (
        message.toLowerCase().includes('locked') ||
        (error as { response?: { status?: number } })?.response?.status === 423
      ) {
        setTimeout(() => {
          navigate('/account-locked');
        }, 1500);
      }
    }
  };

  const { onBlur: passOnBlur, ...passRegister } = register('password');

  return (
    <div className="font-sans w-full space-y-6">
      {/* Top Security Shield Icon Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] dark:bg-[#6D4AFF]/15 border border-[#DDD6FE] dark:border-[#6D4AFF]/30 flex items-center justify-center text-[#6D4AFF] dark:text-[#8B5CF6] mx-auto shadow-[0_4px_16px_rgba(109,74,255,0.12)] dark:shadow-[0_0_25px_rgba(124,92,252,0.35)]">
          <Shield className="w-7 h-7 text-[#6D4AFF] dark:text-[#8B5CF6]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#0B132B] dark:text-white tracking-tight">
            Sign In to MERC
          </h2>
          <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1 font-medium">
            Access your manufacturing control portal
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Address Input */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-gray-400 mb-1.5">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] dark:text-gray-400 z-10">
              <Mail size={16} />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="admin@indent.com"
              className="pl-10 h-[52px] bg-[#F8FAFC] dark:bg-black/40 border-[#D9DEEA] dark:border-white/15 text-[#0B132B] dark:text-white placeholder-[#94A3B8] dark:placeholder-gray-500 focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 rounded-xl text-sm font-medium transition-all"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-gray-400 mb-1.5">
            PASSWORD
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
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#475569] dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="w-4 h-4 rounded border-[#D9DEEA] dark:border-white/20 bg-[#F8FAFC] dark:bg-black/40 text-[#6D4AFF] focus:ring-[#6D4AFF] accent-[#6D4AFF] cursor-pointer"
            />
            Remember Me
          </label>
          <Link
            to="/forgot-password"
            className="text-xs font-bold text-[#6D4AFF] hover:text-[#5B37EB] dark:text-[#8B5CF6] dark:hover:text-[#A78BFA] hover:underline focus:outline-none rounded transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting || loginMutation.isPending}
          disabled={isSubmitting || loginMutation.isPending}
          fullWidth
          className="h-[52px] text-sm font-bold bg-gradient-to-r from-[#6D4AFF] to-[#7C5CFC] hover:from-[#5E39FF] hover:to-[#6D4AFF] text-white rounded-xl shadow-[0_4px_20px_rgba(109,74,255,0.35)] border-0 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span>{isSubmitting || loginMutation.isPending ? 'Signing In...' : 'Sign In'}</span>
          {!isSubmitting && !loginMutation.isPending && <ArrowRight size={16} />}
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;
