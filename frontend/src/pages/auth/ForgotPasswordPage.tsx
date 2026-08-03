import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/axios';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
        'If the email is registered, a password reset link has been dispatched to your inbox.',
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card font-sans">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary m-0 mb-2">Forgot Password</h2>
        <p className="text-text-muted text-sm m-0">
          Enter your email and we'll send you a password reset link
        </p>
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

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          icon={loading ? undefined : <Mail size={16} />}
          fullWidth
          className="mt-6 mb-6"
        >
          {loading ? 'Sending link...' : 'Send Reset Link'}
        </Button>

        <div className="text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-accent-primary hover:underline inline-flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-accent-primary rounded"
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};
