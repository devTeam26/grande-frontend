import type { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'u01',
    email: 'admin@alfakhama.com',
    firstName: 'omnia',
    lastName: 'safwat',
    phone: '+966501234567',
    role: 'super_admin',
    loyaltyPoints: 0,
    loyaltyTier: 'platinum',
    totalSpent: 0,
    bookingsCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    preferences: { language: 'ar', notifications: { email: true, whatsapp: true, sms: false } },
    isActive: true,
  },
  {
    id: 'u02',
    email: 'manager@alfakhama.com',
    firstName: 'Sara',
    lastName: 'Al-Otaibi',
    phone: '+966507654321',
    role: 'manager',
    loyaltyPoints: 0,
    loyaltyTier: 'bronze',
    totalSpent: 0,
    bookingsCount: 0,
    createdAt: '2024-03-15T00:00:00Z',
    preferences: { language: 'en', notifications: { email: true, whatsapp: false, sms: false } },
    isActive: true,
  },
  {
    id: 'u03',
    email: 'khalid@example.com',
    firstName: 'Khalid',
    lastName: 'Al-Ghamdi',
    phone: '+966509876543',
    role: 'user',
    loyaltyPoints: 5800,
    loyaltyTier: 'gold',
    totalSpent: 28400,
    bookingsCount: 7,
    createdAt: '2024-06-10T00:00:00Z',
    preferences: { language: 'ar', notifications: { email: true, whatsapp: true, sms: true } },
    isActive: true,
  },
];

// Test credentials (no real auth in this demo)
export const DEMO_CREDENTIALS = {
  admin: { email: 'admin@alfakhama.com', password: 'admin123' },
  manager: { email: 'manager@alfakhama.com', password: 'manager123' },
  user: { email: 'khalid@example.com', password: 'user123' },
};

export default mockUsers;
