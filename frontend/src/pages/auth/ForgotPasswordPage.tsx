import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '../../api/services/auth';
import { Mail, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const forgotPasswordMutation = useForgotPassword();

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

  const onSubmit = (data: ForgotPasswordFields) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    forgotPasswordMutation.mutate(
      { email: data.email },
      {
        onSuccess: () => {
          setSuccessMsg(
            'If the email is registered, a password reset link has been dispatched to your inbox.',
          );
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const msg =
            err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
          setErrorMsg(msg);
        },
      },
    );
  };

  return (
    <div className="font-sans w-full space-y-6">
      {/* Top Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] dark:bg-[#6D4AFF]/15 border border-[#DDD6FE] dark:border-[#6D4AFF]/30 flex items-center justify-center text-[#6D4AFF] dark:text-[#8B5CF6] mx-auto shadow-[0_4px_16px_rgba(109,74,255,0.12)] dark:shadow-[0_0_25px_rgba(124,92,252,0.35)]">
          <KeyRound className="w-7 h-7 text-[#6D4AFF] dark:text-[#8B5CF6]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#0B132B] dark:text-white tracking-tight">
            Forgot Password
          </h2>
          <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1 font-medium">
            Enter your email and we'll send you a password reset link
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

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          loading={forgotPasswordMutation.isPending}
          disabled={forgotPasswordMutation.isPending}
          fullWidth
          className="h-[52px] text-sm font-bold bg-gradient-to-r from-[#6D4AFF] to-[#7C5CFC] hover:from-[#5E39FF] hover:to-[#6D4AFF] text-white rounded-xl shadow-[0_4px_20px_rgba(109,74,255,0.35)] border-0 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <span>{forgotPasswordMutation.isPending ? 'Sending link...' : 'Send Reset Link'}</span>
          {!forgotPasswordMutation.isPending && <ArrowRight size={16} />}
        </Button>

        {/* Return to Sign In Link */}
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
    </div>
  );
};

export default ForgotPasswordPage;
