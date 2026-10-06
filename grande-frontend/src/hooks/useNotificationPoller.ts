import { useEffect, useRef } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { fetchAdminBookings, fetchMyBookings } from '../store/slices/bookingSlice';
import type { ApiBooking } from '../store/slices/bookingSlice';
import {
  addNotification,
  setLastBookingIds,
  setLastBookingStatuses,
} from '../store/slices/notificationSlice';
import toast from 'react-hot-toast';

const ADMIN_INTERVAL = 30_000;
const USER_INTERVAL  = 45_000;

export function useNotificationPoller() {
  const dispatch    = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const isAdmin     = user?.roles === 'admin';
  const lang        = useAppSelector((s) => s.ui.language) as 'en' | 'ar';

  const lastIds     = useAppSelector((s) => s.notifications.lastBookingIds);
  const lastStats   = useAppSelector((s) => s.notifications.lastBookingStatuses);

  // stable refs so interval always sees latest Redux state without recreating
  const langRef     = useRef(lang);
  const lastIdsRef  = useRef(lastIds);
  const lastStatRef = useRef(lastStats);
  const seededRef   = useRef(false); // admin: has seeded once

  useEffect(() => { langRef.current    = lang; },     [lang]);
  useEffect(() => { lastIdsRef.current = lastIds; },  [lastIds]);
  useEffect(() => { lastStatRef.current = lastStats; }, [lastStats]);

  useEffect(() => {
    if (!isAuthenticated) return;
    seededRef.current = false; // reset on auth change

    if (isAdmin) {
      // ── ADMIN: detect new or updated bookings ─────────────────────────────
      const tick = async () => {
        const result = await (dispatch as any)(fetchAdminBookings());
        const bookings: ApiBooking[] = result?.payload ?? [];
        if (!Array.isArray(bookings)) return;

        const known = lastIdsRef.current;

        if (!seededRef.current || known.length === 0) {
          dispatch(setLastBookingIds(bookings.map((b) => b.id)));
          seededRef.current = true;
          return;
        }

        const newOnes = bookings.filter((b) => !known.includes(b.id));
        if (newOnes.length > 0) {
          newOnes.forEach((b) => {
            dispatch(addNotification({
              type: 'new_booking',
              titleEn: 'New Booking Request',
              titleAr: 'طلب حجز جديد',
              bodyEn: `${b.guestFirstName} ${b.guestLastName} requested "${b.chaletName}"`,
              bodyAr: `${b.guestFirstName} ${b.guestLastName} طلب "${b.chaletName}"`,
              bookingId: b.id,
            }));
          });
          const l = langRef.current;
          const msg = l === 'ar'
            ? `${newOnes.length} طلب حجز جديد`
            : `${newOnes.length} new booking request${newOnes.length > 1 ? 's' : ''}`;
          toast(msg, { icon: '🔔', duration: 6000 });
          dispatch(setLastBookingIds(bookings.map((b) => b.id)));
        }
      };

      tick();
      const id = setInterval(tick, ADMIN_INTERVAL);
      return () => clearInterval(id);

    } else {
      // ── USER: detect status changes on own bookings ───────────────────────
      const tick = async () => {
        const result = await (dispatch as any)(fetchMyBookings());
        const bookings: ApiBooking[] = result?.payload ?? [];
        if (!Array.isArray(bookings)) return;

        const prev = lastStatRef.current;

        if (Object.keys(prev).length === 0) {
          const seed: Record<string, string> = {};
          bookings.forEach((b) => { seed[b.id] = b.status; });
          dispatch(setLastBookingStatuses(seed));
          return;
        }

        const changed = bookings.filter(
          (b) => prev[b.id] !== undefined && prev[b.id] !== b.status,
        );

        if (changed.length > 0) {
          changed.forEach((b) => {
            dispatch(addNotification({
              type: 'booking_update',
              titleEn: 'Booking Status Updated',
              titleAr: 'تحديث حالة الحجز',
              bodyEn: `Booking #${b.bookingNumber} is now "${b.statusName || b.status}"`,
              bodyAr: `حجزك #${b.bookingNumber} أصبح "${b.statusName || b.status}"`,
              bookingId: b.id,
            }));
            const l = langRef.current;
            toast(
              l === 'ar'
                ? `حجزك #${b.bookingNumber} أصبح "${b.statusName || b.status}"`
                : `Booking #${b.bookingNumber} is now "${b.statusName || b.status}"`,
              { icon: '📋', duration: 6000 },
            );
          });
          const next: Record<string, string> = { ...prev };
          bookings.forEach((b) => { next[b.id] = b.status; });
          dispatch(setLastBookingStatuses(next));
        }
      };

      tick();
      const id = setInterval(tick, USER_INTERVAL);
      return () => clearInterval(id);
    }
  }, [isAuthenticated, isAdmin, dispatch]);
}
