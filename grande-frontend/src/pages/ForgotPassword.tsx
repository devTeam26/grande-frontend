import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../store/slices/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export function ForgotPassword() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSent(true);
      } else {
        toast.error(result.message || (lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, try again'));
      }
    } catch {
      toast.error(lang === 'ar' ? 'خطأ في الاتصال، حاول مجدداً' : 'Connection error, please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          {lang === 'ar'
            ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور'
            : "Enter your email and we'll send you a reset link"}
        </p>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 font-medium mb-1">
              {lang === 'ar' ? 'تم الإرسال!' : 'Email sent!'}
            </p>
            <p className="text-green-600 text-sm">
              {lang === 'ar'
                ? 'تحقق من بريدك الإلكتروني واتبع التعليمات'
                : 'Check your inbox and follow the instructions'}
            </p>
            <Link to="/login" className="inline-block mt-4 text-sm text-gold-600 hover:text-gold-700">
              {lang === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <Input
              label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button fullWidth onClick={() => {}} isLoading={loading} type="submit">
              {lang === 'ar' ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                {lang === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
