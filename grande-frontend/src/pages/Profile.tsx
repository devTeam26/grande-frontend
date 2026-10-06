import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Award, Calendar, Pencil, X, Lock, Hash } from 'lucide-react';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { fetchMyBookings } from '../store/slices/bookingSlice';
import { fetchProfile, updateProfile, changePassword } from '../store/slices/authSlice';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LOYALTY_TIERS } from '../utils/constants';
import toast from 'react-hot-toast';

export function Profile() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const myBookings = useAppSelector((s) => s.booking.myBookings);
  const myBookingsLoading = useAppSelector((s) => s.booking.myBookingsLoading);
  const myBookingsError = useAppSelector((s) => s.booking.myBookingsError);
  const chalets = useAppSelector((s) => s.chalets.chalets);

  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  useEffect(() => {
    // fetchProfile runs first so its token refresh completes before fetchMyBookings fires.
    // Firing both simultaneously causes a race: two concurrent 401s → two refresh attempts →
    // the API rejects the second one → bookings fail with 401 even though the user is valid.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dispatch as any)(fetchProfile()).finally(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dispatch as any)(fetchMyBookings());
    });
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone(user.phoneNumber);
    }
  }, [user?.id]);

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const tier = LOYALTY_TIERS[user.loyaltyTier];
  const tierColors = { bronze: 'text-orange-700 bg-orange-50', silver: 'text-gray-700 bg-gray-100', gold: 'text-gold-700 bg-gold-50', platinum: 'text-purple-700 bg-purple-50' };

  const filteredBookings = myBookings.filter((b) => {
    const s = b.status.toLowerCase();
    if (tab === 'upcoming') return s === 'confirmed' || s === 'pending';
    if (tab === 'past') return s === 'completed' || s === 'checkedout';
    return s === 'cancelled';
  });

  async function handleSaveProfile() {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (dispatch as any)(updateProfile({ firstName, lastName, phoneNumber: phone, preferredLanguage: lang })) as { success: boolean; message?: string };
    setSaving(false);
    if (result?.success) {
      toast.success(lang === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated');
      setEditOpen(false);
    } else {
      toast.error(result?.message || 'Failed to update profile');
    }
  }

  async function handleChangePassword() {
    if (newPw !== confirmPw) { toast.error(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return; }
    if (newPw.length < 6) { toast.error(lang === 'ar' ? 'كلمة المرور قصيرة جداً' : 'Password too short'); return; }
    setPwSaving(true);
    try {
      const result = await changePassword({ currentPassword: currentPw, newPassword: newPw });
      if (result.success) {
        toast.success(lang === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed');
        setPwOpen(false);
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('profile.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – user card */}
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <h2 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <p className="text-gray-400 text-xs mt-0.5">{user.phoneNumber}</p>
              <span className={`mt-2 text-xs font-medium px-3 py-1 rounded-full ${tierColors[user.loyaltyTier]}`}>
                {tier.label[lang]}
              </span>

              <div className="flex gap-2 mt-4 w-full">
                <button
                  type="button"
                  onClick={() => { setEditOpen((v) => !v); setPwOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-gray-200 rounded-xl py-2 hover:border-gold-400 hover:text-gold-600 transition-colors"
                >
                  {editOpen ? <X size={13} /> : <Pencil size={13} />}
                  {editOpen ? (lang === 'ar' ? 'إلغاء' : 'Cancel') : (lang === 'ar' ? 'تعديل' : 'Edit')}
                </button>
                <button
                  type="button"
                  onClick={() => { setPwOpen((v) => !v); setEditOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-gray-200 rounded-xl py-2 hover:border-gold-400 hover:text-gold-600 transition-colors"
                >
                  {pwOpen ? <X size={13} /> : <Lock size={13} />}
                  {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                </button>
              </div>
            </div>

            {editOpen && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <Input label={lang === 'ar' ? 'الاسم الأول' : 'First Name'} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input label={lang === 'ar' ? 'اسم العائلة' : 'Last Name'} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <Input label={lang === 'ar' ? 'رقم الجوال' : 'Phone'} value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Button fullWidth size="sm" onClick={handleSaveProfile} isLoading={saving}>
                  {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
              </div>
            )}

            {pwOpen && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <Input label={lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'} type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                <Input label={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                <Input label={lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                <Button fullWidth size="sm" onClick={handleChangePassword} isLoading={pwSaving}>
                  {lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                </Button>
                <div className="text-center">
                  <Link to="/forgot-password" className="text-xs text-gold-600 hover:text-gold-700">
                    {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </Link>
                </div>
              </div>
            )}
          </Card>

          {/* Loyalty card */}
          <Card className="bg-gradient-to-br from-navy-800 to-navy-900 border-0 text-white" padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Award size={18} className="text-gold-400" />
              <span className="font-semibold text-sm">{t('profile.loyalty_title')}</span>
            </div>
            <div className="text-3xl font-bold text-gold-400 mb-1">{user.loyaltyPoints.toLocaleString()}</div>
            <p className="text-navy-200 text-xs mb-3">{t('profile.points')}</p>

            {user.loyaltyTier !== 'platinum' && (
              <div>
                <div className="flex justify-between text-xs text-navy-300 mb-1">
                  <span>{tier.label[lang]}</span>
                  <span>{LOYALTY_TIERS[user.loyaltyTier === 'bronze' ? 'silver' : user.loyaltyTier === 'silver' ? 'gold' : 'platinum'].label[lang]}</span>
                </div>
                <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gold-400 rounded-full transition-all" style={{ width: `${Math.min(100, ((user.loyaltyPoints - tier.min) / (tier.max - tier.min)) * 100)}%` }} />
                </div>
                <p className="text-xs text-navy-400 mt-1">{Math.max(0, tier.max - user.loyaltyPoints + 1)} pts to next tier</p>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-navy-700 flex justify-between text-xs">
              <span className="text-navy-300">{t('profile.total_spent')}</span>
              <span className="text-white font-medium">{user.totalSpent.toLocaleString()} KWD</span>
            </div>
          </Card>
        </div>

        {/* Right – bookings */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
            {(['upcoming', 'past', 'cancelled'] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === tabKey ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t(`profile.${tabKey}`)}
              </button>
            ))}
          </div>

          {myBookingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : myBookingsError ? (
            <div className="text-center py-16">
              <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-4">{lang === 'ar' ? 'تعذّر تحميل الحجوزات' : 'Could not load bookings'}</p>
              <Button
                variant="outline"
                onClick={() =>
                  (dispatch as any)(fetchProfile()).finally(() =>
                    (dispatch as any)(fetchMyBookings())
                  )
                }
              >
                {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('profile.no_bookings')}</p>
              <Link to="/chalets"><Button className="mt-4" variant="outline">Browse Chalets</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const chalet = chalets.find((c) => c.id === booking.chaletId);
                const s = booking.status.toLowerCase();
                return (
                  <Card key={booking.id} padding="none" className="overflow-hidden">
                    <div className="flex gap-4 p-4">
                      {chalet?.images?.[0] && (
                        <img src={chalet.images[0]} alt={booking.chaletName} className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{booking.chaletName}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Hash size={10} className="text-gray-400" />
                              <span className="text-xs text-gray-400 font-mono">{booking.bookingNumber}</span>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            s === 'confirmed' ? 'bg-green-100 text-green-700' :
                            s === 'pending' ? 'bg-amber-100 text-amber-700' :
                            s === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {booking.statusName || booking.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Calendar size={11} />
                          {booking.checkInDate && format(parseISO(booking.checkInDate), 'dd MMM')} → {booking.checkOutDate && format(parseISO(booking.checkOutDate), 'dd MMM yyyy')}
                          {' · '}{booking.nights} {lang === 'ar' ? 'ليالي' : 'nights'}
                        </div>
                        <div className="flex items-center mt-2">
                          <span className="text-sm font-semibold text-gray-900">{booking.totalAmount.toLocaleString()} KWD</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
