import { useState } from 'react';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { toggleUserActive, addUser } from '../../store/slices/adminSlice';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LOYALTY_TIERS } from '../../utils/constants';
import type { User, UserRole } from '../../types';
import toast from 'react-hot-toast';

export function ManageUsers() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const lang = i18n.language as 'en' | 'ar';
  const users = useAppSelector((s) => s.admin.users);
  const { user: currentUser } = useAppSelector((s) => s.auth);

  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'staff' as UserRole });

  const roleColors = { super_admin: 'red', manager: 'gold', staff: 'navy', user: 'gray' } as const;

  function handleAddUser() {
    if (!newUser.firstName || !newUser.email) { toast.error('Fill required fields'); return; }
    const u: User = {
      id: `u_${Date.now()}`,
      ...newUser,
      loyaltyPoints: 0,
      loyaltyTier: 'bronze',
      totalSpent: 0,
      bookingsCount: 0,
      createdAt: new Date().toISOString(),
      preferences: { language: 'en', notifications: { email: true, whatsapp: false, sms: false } },
      isActive: true,
    };
    dispatch(addUser(u));
    setShowAdd(false);
    setNewUser({ firstName: '', lastName: '', email: '', phone: '', role: 'staff' });
    toast.success('User added');
  }

  return (
    <div className="space-y-4">
      {currentUser?.role === 'super_admin' && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus size={16} /> Add Staff User
          </Button>
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['User', 'Role', 'Loyalty', 'Bookings', 'Total Spent', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const tier = LOYALTY_TIERS[u.loyaltyTier];
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleColors[u.role] ?? 'gray'} size="sm">
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium">{u.loyaltyPoints.toLocaleString()} pts</p>
                    <p className="text-xs text-gray-400">{tier.label[lang]}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.bookingsCount}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.totalSpent.toLocaleString()} KWD</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'green' : 'red'} size="sm">{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => { dispatch(toggleUserActive(u.id)); toast.success('Updated'); }}
                        className={u.isActive ? 'text-green-600' : 'text-gray-400'}
                      >
                        {u.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Add user modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Staff User" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={newUser.firstName} onChange={(e) => setNewUser((p) => ({ ...p, firstName: e.target.value }))} />
            <Input label="Last Name" value={newUser.lastName} onChange={(e) => setNewUser((p) => ({ ...p, lastName: e.target.value }))} />
          </div>
          <Input label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Phone" value={newUser.phone} onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as UserRole }))}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="staff">Staff (view bookings only)</option>
              <option value="manager">Manager (bookings + reports)</option>
              {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddUser}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
