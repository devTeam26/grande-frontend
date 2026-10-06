import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { loginWithAPI, clearError } from '../store/slices/authSlice';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});
type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth);

  // If the user was redirected here from a protected page, go back there after login.
  // Otherwise fall back to the home page.
  const from = (location.state as { from?: string })?.from ?? '/';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
    return () => { dispatch(clearError()); };
  }, [isAuthenticated, navigate, dispatch, from]);

  function onSubmit(data: LoginForm) {
    dispatch(loginWithAPI({email:data.email, password:data.password}) as unknown as Parameters<typeof dispatch>[0]);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-gold-50 border border-gold-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            <span className="text-xs font-medium text-gold-600 tracking-widest uppercase">Grande Beach</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gold-600 to-gray-700 bg-clip-text text-transparent">
            {t('auth.login_title')}
          </h1>
          <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          <p className="text-gray-400 text-sm mt-3">{t('auth.login_subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label={t('auth.password')}
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-gold-600 hover:text-gold-700">{t('auth.forgot_password')}</Link>
            </div>
            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>{t('auth.login_btn')}</Button>
          </form>

        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="text-gold-600 font-medium hover:text-gold-700">{t('nav.register')}</Link>
        </p>
      </div>
    </div>
  );
}
