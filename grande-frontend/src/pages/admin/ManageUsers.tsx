import { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight, Search, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import {
  fetchAdminUsers, activateUser, deactivateUser, createStaffUser,
} from '../../store/slices/adminSlice';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export function ManageUsers() {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';

  const apiUsers = useAppSelector((s) => s.admin.apiUsers);
  const usersLoading = useAppSelector((s) => s.admin.usersLoading);
  const { user: currentUser } = useAppSelector((s) => s.auth);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // API doesn't return isActive — track it locally after each toggle
  const [localActive, setLocalActive] = useState<Record<string, boolean>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '', lastName: '', email: '',
    password: '', phoneNumber: '', role: 'User',
  });

  useEffect(() => {
    (dispatch as any)(fetchAdminUsers());
  }, [dispatch]);

  function reload() {
    (dispatch as any)(fetchAdminUsers());
  }

  const filtered = apiUsers.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);
    const userRole = (u.roles?.[0] ?? '').toLowerCase();
    const matchRole =
      roleFilter === 'all' ||
      (roleFilter === 'guest' && (userRole === 'guest' || userRole === 'user')) ||
      (roleFilter === 'admin' && userRole === 'admin');
    return matchSearch && matchRole;
  });

  async function handleToggle(u: typeof apiUsers[0]) {
    const currentlyActive = localActive[u.id] ?? u.isActive ?? false;
    setTogglingId(u.id);
    const fn = currentlyActive ? deactivateUser : activateUser;
    const result = await fn(u.id);
    if (result.success) {
      const nowActive = !currentlyActive;
      setLocalActive((prev) => ({ ...prev, [u.id]: nowActive }));
      toast.success(nowActive
        ? (lang === 'ar' ? 'تم تفعيل المستخدم' : 'User activated')
        : (lang === 'ar' ? 'تم تعطيل المستخدم' : 'User deactivated'));
    } else {
      toast.error(result.message || 'Failed');
    }
    setTogglingId(null);
  }

  async function handleCreate() {
    if (!newUser.firstName || !newUser.email || !newUser.password) {
      toast.error(lang === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields');
      return;
    }
    setSaving(true);
    const result = await createStaffUser(newUser);
    setSaving(false);
    if (result.success) {
      toast.success(lang === 'ar' ? 'تم إنشاء المستخدم' : 'User created');
      setShowAdd(false);
      setNewUser({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', role: 'User' });
      reload();
    } else {
      toast.error(result.message || 'Failed to create user');
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card padding="md">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث عن مستخدم...' : 'Search users...'}
              className="w-full ps-9 pe-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="all">{lang === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
            <option value="admin">Admin</option>
            <option value="guest">{lang === 'ar' ? 'ضيف' : 'Guest'}</option>
          </select>
          <Button variant="outline" size="sm" onClick={reload} isLoading={usersLoading}>
            <RefreshCw size={14} />
            {lang === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
          <span className="text-sm text-gray-500">{filtered.length} {lang === 'ar' ? 'مستخدم' : 'users'}</span>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 ms-auto">
            <Plus size={15} />
            {lang === 'ar' ? 'إضافة مستخدم' : 'Add User'}
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  lang === 'ar' ? 'المستخدم' : 'User',
                  lang === 'ar' ? 'الدور' : 'Role',
                  lang === 'ar' ? 'نقاط الولاء' : 'Loyalty',
                  lang === 'ar' ? 'الحجوزات' : 'Bookings',
                  lang === 'ar' ? 'الحالة' : 'Status',
                  lang === 'ar' ? 'الإجراءات' : 'Actions',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersLoading && apiUsers.length === 0 ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  {lang === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
                </td></tr>
              ) : (
                filtered.map((u) => {
                  const role = (u.roles?.[0] ?? 'Guest').toLowerCase();
                  const isAdmin = role === 'admin';
                  const isActive = localActive[u.id] ?? u.isActive ?? false;
                  const initials = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {initials || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                            {u.phoneNumber && <p className="text-xs text-gray-400">{u.phoneNumber}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isAdmin ? 'gold' : 'gray'} size="sm">
                          {isAdmin ? 'Admin' : 'Guest'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{(u.loyaltyPoints ?? 0).toLocaleString()} pts</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.totalBookings ?? 0}</td>
                      <td className="px-4 py-3">
                        <Badge variant={isActive ? 'green' : 'red'} size="sm">
                          {isActive ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطّل' : 'Inactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => u.id !== currentUser?.id && handleToggle(u)}
                          disabled={togglingId === u.id || u.id === currentUser?.id}
                          className={`transition-colors disabled:opacity-30 ${
                            u.id === currentUser?.id ? 'cursor-not-allowed text-gray-200' :
                            isActive ? 'text-green-500 hover:text-red-500' : 'text-red-400 hover:text-green-500'
                          }`}
                          title={u.id === currentUser?.id ? 'Cannot toggle own account' : isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add user modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={lang === 'ar' ? 'إضافة مستخدم' : 'Add Staff User'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label={lang === 'ar' ? 'الاسم الأول *' : 'First Name *'} value={newUser.firstName} onChange={(e) => setNewUser((p) => ({ ...p, firstName: e.target.value }))} />
            <Input label={lang === 'ar' ? 'اسم العائلة' : 'Last Name'} value={newUser.lastName} onChange={(e) => setNewUser((p) => ({ ...p, lastName: e.target.value }))} />
          </div>
          <Input label={lang === 'ar' ? 'البريد الإلكتروني *' : 'Email *'} type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} />
          <Input label={lang === 'ar' ? 'كلمة المرور *' : 'Password *'} type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} />
          <Input label={lang === 'ar' ? 'رقم الهاتف' : 'Phone'} value={newUser.phoneNumber} onChange={(e) => setNewUser((p) => ({ ...p, phoneNumber: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">{lang === 'ar' ? 'الدور' : 'Role'}</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="User">{lang === 'ar' ? 'مستخدم' : 'User'}</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleCreate} isLoading={saving}>{lang === 'ar' ? 'إنشاء' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
