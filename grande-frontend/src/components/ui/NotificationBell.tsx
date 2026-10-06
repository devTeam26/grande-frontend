import { Fragment } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { markRead, markAllRead, clearAll } from '../../store/slices/notificationSlice';

export function NotificationBell() {
  const dispatch = useAppDispatch();
  const lang = useAppSelector((s) => s.ui.language) as 'en' | 'ar';
  const items = useAppSelector((s) => s.notifications.items);
  const unread = items.filter((n) => !n.read).length;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 end-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute end-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">
              {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
              {unread > 0 && (
                <span className="ms-2 bg-red-100 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </span>
            <div className="flex gap-1">
              {unread > 0 && (
                <button
                  onClick={() => dispatch(markAllRead())}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title={lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                >
                  <Check size={14} />
                </button>
              )}
              {items.length > 0 && (
                <button
                  onClick={() => dispatch(clearAll())}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                  title={lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <Bell size={28} className="mx-auto mb-2 text-gray-200" />
                {lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </div>
            ) : (
              items.map((n) => (
                <Menu.Item key={n.id}>
                  {() => (
                    <div
                      onClick={() => dispatch(markRead(n.id))}
                      className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5 ${
                        n.type === 'new_booking' ? 'bg-gold-100 text-gold-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {n.type === 'new_booking' ? '🔔' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-gray-900 ${!n.read ? 'font-semibold' : ''}`}>
                          {lang === 'ar' ? n.titleAr : n.titleEn}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {lang === 'ar' ? n.bodyAr : n.bodyEn}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
                    </div>
                  )}
                </Menu.Item>
              ))
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
