import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../../api/services/auth';
import { useCapsLock } from '../../hooks/useCapsLock';
import { LogIn, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
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

  // Raw axios error fallback
  if (err.response?.data?.message && typeof err.response.data.message === 'string') {
    return err.response.data.message;
  }

  // ApiError format (from interceptors)
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

  const onSubmit = (data: LoginFields) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (data.rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, data.email);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }

    loginMutation.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          setSuccessMsg('Login Successful! Redirecting...');
        },
        onError: (error: unknown) => {
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
        },
      },
    );
  };

  const { onBlur: passOnBlur, ...passRegister } = register('password');

  return (
    <div className="auth-card font-sans">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold m-0 mb-2 text-text-primary">Indent Portal</h2>
        <p className="text-text-muted text-sm m-0">Sign in to manage indents and costing</p>
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          id="email"
          type="email"
          label="Email Address"
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            id="password"
            type="password"
            label="Password"
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
        </div>

        <div className="form-group flex items-center justify-between mt-6 mb-6">
          <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary accent-accent-primary"
            />
            Remember Me
          </label>
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-accent-primary hover:underline focus:outline-none focus:ring-1 focus:ring-accent-primary rounded"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loginMutation.isPending}
          icon={loginMutation.isPending ? undefined : <LogIn size={16} />}
          fullWidth
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
};
