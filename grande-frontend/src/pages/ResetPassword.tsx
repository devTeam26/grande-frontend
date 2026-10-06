import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../store/slices/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export function ResetPassword() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';

  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast.error(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (newPw.length < 6) {
      toast.error(lang === 'ar' ? 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' : 'Password must be at least 6 characters');
      return;
    }
    if (!email || !token) {
      toast.error(lang === 'ar' ? 'رابط غير صالح' : 'Invalid reset link');
      return;
    }
    setLoading(true);
    try {
      const result = await resetPassword({ email, token, newPassword: newPw });
      if (result.success) {
        toast.success(lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password reset successfully');
        navigate('/login');
      } else {
        toast.error(result.message || (lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, try again'));
      }
    } catch {
      toast.error(lang === 'ar' ? 'خطأ في الاتصال، حاول مجدداً' : 'Connection error, please try again');
    } finally {
      setLoading(false);
    }
  }

  if (!email || !token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {lang === 'ar' ? 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية' : 'Invalid or expired reset link'}
          </p>
          <Link to="/forgot-password" className="text-gold-600 hover:text-gold-700 text-sm">
            {lang === 'ar' ? 'طلب رابط جديد' : 'Request a new link'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {lang === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          {lang === 'ar' ? `إعادة تعيين كلمة المرور لـ ${email}` : `Reset password for ${email}`}
        </p>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <Input
            label={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
          />
          <Input
            label={lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
          />
          <Button fullWidth onClick={() => {}} isLoading={loading} type="submit">
            {lang === 'ar' ? 'تعيين كلمة المرور' : 'Reset Password'}
          </Button>
          <div className="text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
              {lang === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
