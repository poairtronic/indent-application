import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../lib/axios';
import { LogIn, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  rememberMe: z.boolean().optional(),
});

type LoginFields = z.infer<typeof loginSchema>;

function getLoginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message && typeof error.response.data.message === 'string') {
      return error.response.data.message;
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Unable to reach the server. Make sure the backend is running and try again.';
    }

    if (error.response?.status && error.response.status >= 500) {
      return 'The server encountered an error while signing you in. Please try again.';
    }
  }

  return 'Login failed. Please try again.';
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      const { accessToken, refreshToken, user } = response.data.data;

      login(accessToken, refreshToken, user);
      setSuccessMsg('Login Successful! Redirecting...');
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (error: unknown) {
      setErrorMsg(getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold m-0 mb-2">Indent Portal</h2>
        <p className="text-text-muted text-sm m-0">Sign in to manage indents and costing</p>
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
          <label className="form-label" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="name@company.com"
            {...register('email')}
          />
          {errors.email && <div className="form-error">{errors.email.message}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && <div className="form-error">{errors.password.message}</div>}
        </div>

        <div className="form-group flex items-center justify-between mt-6 mb-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="accent-[var(--primary)]"
            />
            Remember Me
          </label>
          <Link to="/forgot-password" className="auth-link">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};
