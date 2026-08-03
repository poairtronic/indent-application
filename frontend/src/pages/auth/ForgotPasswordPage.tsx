import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/axios';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFields) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiClient.post('/auth/forgot-password', {
        email: data.email,
      });
      setSuccessMsg(
        'If the email is registered, a password reset token was generated. Please check your developer server logs.',
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold m-0 mb-2">Forgot Password</h2>
        <p className="text-text-muted text-sm m-0">
          Enter your email and we'll send you a password reset link
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

        <button type="submit" className="btn-primary mt-6 mb-6" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
          {loading ? 'Sending link...' : 'Send Reset Link'}
        </button>

        <div className="text-center">
          <Link to="/login" className="auth-link inline-flex items-center gap-1">
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};
