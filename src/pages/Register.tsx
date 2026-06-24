import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
// ── registerWithAPI replaces the old fake loginSuccess call ─────────────────
import { registerWithAPI, clearError } from '../store/slices/authSlice';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9),
  password: z.string().min(6),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // error is now shown to the user — comes from the API response
  const { isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/');
    return () => { dispatch(clearError()); };
  }, [isAuthenticated, navigate, dispatch]);

  function onSubmit(data: RegisterForm) {
    // ── REAL API CALL ────────────────────────────────────────────────────────
    // Sends exactly the fields the backend expects.
    // phone (form field) → phoneNumber (API field name)
    // preferredLanguage is taken from the current active UI language
    dispatch(registerWithAPI({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phoneNumber: data.phone,          // form uses "phone", API expects "phoneNumber"
      preferredLanguage: i18n.language, // "en" or "ar" — matches current UI language
      // confirmPassword is NOT sent — it is UI-only validation, not an API field
    }));
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold-500 flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-2xl">ف</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.register_title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('auth.register_subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('auth.first_name')} {...register('firstName')} error={errors.firstName?.message} />
              <Input label={t('auth.last_name')} {...register('lastName')} error={errors.lastName?.message} />
            </div>
            <Input label={t('auth.email')} type="email" {...register('email')} error={errors.email?.message} />
            <Input label={t('auth.phone')} type="tel" {...register('phone')} error={errors.phone?.message} />
            <Input label={t('auth.password')} type="password" {...register('password')} error={errors.password?.message} />
            <Input label={t('auth.confirm_password')} type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
            {/* Shows error message returned by the API (e.g. "Email already exists") */}
            {error && (
              <p className="text-sm text-red-500 text-center rounded-lg bg-red-50 py-2 px-3">{error}</p>
            )}
            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>{t('auth.register_btn')}</Button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">{t('auth.or')}</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <Button variant="outline" fullWidth onClick={() => navigate('/chalets')}>{t('auth.guest_btn')}</Button>

          {/* Loyalty perk */}
          <div className="mt-4 p-3 bg-gold-50 rounded-xl text-xs text-gold-700">
            🌟 Join our Loyalty Program – earn points with every stay and unlock exclusive benefits
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          {t('auth.has_account')}{' '}
          <Link to="/login" className="text-gold-600 font-medium hover:text-gold-700">{t('nav.login')}</Link>
        </p>
      </div>
    </div>
  );
}
