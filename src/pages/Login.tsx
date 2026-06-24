import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { loginWithAPI, clearError, continueAsGuest } from '../store/slices/authSlice';
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold-500 flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-2xl">ف</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.login_title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('auth.login_subtitle')}</p>
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
              <button type="button" className="text-xs text-gold-600 hover:text-gold-700">{t('auth.forgot_password')}</button>
            </div>
            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>{t('auth.login_btn')}</Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">{t('auth.or')}</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <Button
            variant="outline"
            fullWidth
            onClick={() => { dispatch(continueAsGuest()); navigate('/chalets'); }}
          >
            {t('auth.guest_btn')}
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="text-gold-600 font-medium hover:text-gold-700">{t('nav.register')}</Link>
        </p>
      </div>
    </div>
  );
}
