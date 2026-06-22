import type { BlockedDate } from '../types';

export const blockedDates: BlockedDate[] = [
  { chaletId: 'c01', startDate: '2026-05-10', endDate: '2026-05-15', bookingId: 'b001' },
  { chaletId: 'c01', startDate: '2026-05-20', endDate: '2026-05-23', bookingId: 'b002' },
  { chaletId: 'c02', startDate: '2026-05-05', endDate: '2026-05-08', bookingId: 'b003' },
  { chaletId: 'c04', startDate: '2026-05-12', endDate: '2026-05-17', bookingId: 'b004' },
  { chaletId: 'c06', startDate: '2026-05-03', endDate: '2026-05-06', bookingId: 'b005' },
  { chaletId: 'c07', startDate: '2026-05-15', endDate: '2026-05-20', bookingId: 'b006' },
  { chaletId: 'c09', startDate: '2026-05-07', endDate: '2026-05-10', bookingId: 'b007' },
  { chaletId: 'c11', startDate: '2026-05-08', endDate: '2026-05-12', bookingId: 'b008' },
  { chaletId: 'c12', startDate: '2026-05-01', endDate: '2026-05-05', bookingId: 'b009' },
  { chaletId: 'c15', startDate: '2026-05-18', endDate: '2026-05-22', bookingId: 'b010' },
];

export default blockedDates;
