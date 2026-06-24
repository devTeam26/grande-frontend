import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { logout } from '../../store/slices/authSlice';
import { setLanguage } from '../../store/slices/uiSlice';
import { setLanguage as applyLanguage } from '../../i18n';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Fragment } from 'react';
import { Menu as HMenu, Transition } from '@headlessui/react';

export function Header() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const { language } = useAppSelector((s) => s.ui);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.roles === 'super_admin' || user?.roles === 'manager' || user?.roles === 'staff';

  const handleLanguage = () => {
    const next = language === 'en' ? 'ar' : 'en';
    dispatch(setLanguage(next));
    applyLanguage(next);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/chalets', label: t('nav.chalets') },
    { to: '/brands', label: t('nav.brands') },
    { to: '/contact', label: t('nav.contact') },
    { to: '/reviews', label: t('nav.reviews') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-10 w-10 rounded-full border border-gold-400 overflow-hidden flex-shrink-0 bg-white">
              <img
                src="/grand.jpg"
                alt="Grande Beach Al Khiran"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-navy-800 font-bold text-base tracking-tight">Grande Beach</span>
              <span className="text-gold-500 text-xs font-medium">
                {language === 'ar' ? 'خيران - الكويت' : 'Al Khiran, Kuwait'}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === l.to
                    ? 'text-gold-600 bg-gold-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                )}
              >
                {l.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/profile"
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === '/profile'
                    ? 'text-gold-600 bg-gold-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                )}
              >
                {t('nav.bookings')}
              </Link>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLanguage}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Globe size={16} />
              {t('nav.language')}
            </button>

            {isAuthenticated ? (
              <HMenu as="div" className="relative hidden md:block">
                <HMenu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-white text-xs font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.firstName}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </HMenu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <HMenu.Items className="absolute end-0 mt-2 w-52 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none py-1">
                    <HMenu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={cn('flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700', active && 'bg-gray-50')}
                        >
                          <User size={15} /> {t('nav.profile')}
                        </Link>
                      )}
                    </HMenu.Item>
                    {isAdmin && (
                      <HMenu.Item>
                        {({ active }) => (
                          <Link
                            to="/admin"
                            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700', active && 'bg-gray-50')}
                          >
                            <LayoutDashboard size={15} /> {t('nav.admin')}
                          </Link>
                        )}
                      </HMenu.Item>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <HMenu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={cn('flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600', active && 'bg-red-50')}
                        >
                          <LogOut size={15} /> {t('nav.logout')}
                        </button>
                      )}
                    </HMenu.Item>
                  </HMenu.Items>
                </Transition>
              </HMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">{t('nav.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">{t('nav.register')}</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleLanguage}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 text-start"
          >
            <Globe size={15} /> {t('nav.language')}
          </button>
          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                {t('nav.profile')}
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {t('nav.admin')}
                </Link>
              )}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 text-start"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                <Button variant="outline" fullWidth size="sm">{t('nav.login')}</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1">
                <Button fullWidth size="sm">{t('nav.register')}</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
