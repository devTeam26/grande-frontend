import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGoogleLogin } from '@react-oauth/google';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { loginWithAPI, googleLoginWithAPI, clearError } from '../store/slices/authSlice';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const GOOGLE_CONFIGURED = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID as string);

function GoogleButton({ onToken, disabled }: { onToken: (t: string) => void; disabled: boolean }) {
  const googleLogin = useGoogleLogin({
    onSuccess: (r) => onToken(r.access_token),
    onError: () => {},
  });
  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 mb-5"
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  );
}

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

  function handleGoogleToken(token: string) {
    dispatch(googleLoginWithAPI(token) as unknown as Parameters<typeof dispatch>[0]);
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

          {GOOGLE_CONFIGURED && (
            <>
              <GoogleButton onToken={handleGoogleToken} disabled={isLoading} />
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">{t('auth.or')}</span></div>
              </div>
            </>
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
