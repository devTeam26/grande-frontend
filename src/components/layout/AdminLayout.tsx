import { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Home, Users, Tag, DollarSign,
  ChevronLeft, LogOut, Bell,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';
import { cn } from '../../utils/cn';

const adminNav = [
  { to: '/admin', label: 'admin.dashboard', icon: LayoutDashboard },
  { to: '/admin/bookings', label: 'admin.bookings', icon: CalendarDays },
  { to: '/admin/chalets', label: 'admin.chalets', icon: Home },
  { to: '/admin/pricing', label: 'admin.pricing', icon: DollarSign },
  { to: '/admin/users', label: 'admin.users', icon: Users },
  { to: '/admin/promotions', label: 'admin.promotions', icon: Tag },
];

export function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.roles === 'super_admin' || user?.roles === 'manager' || user?.roles === 'staff';

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-navy-900 text-white transition-all duration-300 flex-shrink-0',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-2 h-16 px-4 border-b border-navy-700', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          {!collapsed && <span className="font-bold text-sm">GrandeBeach Admin</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {adminNav.map(({ to, label, icon: Icon }) => {
            const exact = to === '/admin';
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  active
                    ? 'bg-gold-500/20 text-gold-400 border-e-2 border-gold-400'
                    : 'text-navy-300 hover:bg-navy-800 hover:text-white',
                  collapsed && 'justify-center px-2',
                )}
                title={collapsed ? t(label) : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{t(label)}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-navy-700 p-3 space-y-1">
          <Link
            to="/"
            className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-300 hover:text-white hover:bg-navy-800 transition-colors', collapsed && 'justify-center')}
          >
            <Home size={16} className="flex-shrink-0" />
            {!collapsed && 'Back to Site'}
          </Link>
          <button
            onClick={() => dispatch(logout())}
            className={cn('flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/20 transition-colors', collapsed && 'justify-center')}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && t('nav.logout')}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn('flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-300 hover:text-white hover:bg-navy-800 transition-colors', collapsed && 'justify-center')}
          >
            <ChevronLeft size={16} className={cn('transition-transform flex-shrink-0', collapsed && 'rotate-180')} />
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">
            {t(adminNav.find((n) => (n.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(n.to)))?.label ?? 'admin.dashboard')}
          </h1>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-gold-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.roles.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
