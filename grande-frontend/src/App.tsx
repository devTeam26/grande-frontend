import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppSelector';
import { useAppDispatch } from './hooks/useAppDispatch';
import { fetchChalets } from './store/slices/chaletsSlice';
import { tryRefreshToken } from './store/slices/authSlice';
import { Toaster } from 'react-hot-toast';
import AOS from "aos";
import 'aos/dist/aos.css';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';

const Home             = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Chalets          = lazy(() => import('./pages/Chalets').then(m => ({ default: m.Chalets })));
const ChaletDetail     = lazy(() => import('./pages/ChaletDetail').then(m => ({ default: m.ChaletDetail })));
const Booking          = lazy(() => import('./pages/Booking').then(m => ({ default: m.Booking })));
const Checkout         = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const Confirmation     = lazy(() => import('./pages/Confirmation').then(m => ({ default: m.Confirmation })));
const Login            = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register         = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Profile          = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const MyBookings       = lazy(() => import('./pages/MyBookings').then(m => ({ default: m.MyBookings })));
const Brands           = lazy(() => import('./pages/Brands').then(m => ({ default: m.Brands })));
const Contact          = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Reviews          = lazy(() => import('./pages/Reviews').then(m => ({ default: m.Reviews })));
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword    = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const PrivacyPolicy    = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const NotFound         = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

const AdminDashboard   = lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const ManageBookings   = lazy(() => import('./pages/admin/ManageBookings').then(m => ({ default: m.ManageBookings })));
const ManageChalets    = lazy(() => import('./pages/admin/ManageChalets').then(m => ({ default: m.ManageChalets })));
const ManagePricing    = lazy(() => import('./pages/admin/ManagePricing').then(m => ({ default: m.ManagePricing })));
const ManageUsers      = lazy(() => import('./pages/admin/ManageUsers').then(m => ({ default: m.ManageUsers })));
const ManagePromotions = lazy(() => import('./pages/admin/ManagePromotions').then(m => ({ default: m.ManagePromotions })));
const ManageReviews    = lazy(() => import('./pages/admin/ManageReviews').then(m => ({ default: m.ManageReviews })));
const ManageVerification = lazy(() => import('./pages/admin/ManageVerification').then(m => ({ default: m.ManageVerification })));

// Redirects unauthenticated users (including guests) to /login.
// Saves the page they tried to visit so Login can send them back after success.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

function AppRouter() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchChalets());
  }, [dispatch]);

  // Proactively refresh the access token every 10 minutes so photos and API
  // calls never fail mid-session due to token expiration.
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => { void tryRefreshToken(); }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: 'ease-out-cubic',
      once: true,
      offset: 120,
      mirror: false,
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    AOS.refresh();
  }, [location.pathname]);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>}>
    <Routes>
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/chalets" element={<Chalets />} />
        <Route path="/chalets/:id" element={<ChaletDetail />} />
        <Route path="/booking/:chaletId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/confirmation/:bookingId" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="bookings" element={<ManageBookings />} />
        <Route path="chalets" element={<ManageChalets />} />
        <Route path="pricing" element={<ManagePricing />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="promotions" element={<ManagePromotions />} />
        <Route path="reviews" element={<ManageReviews />} />
        <Route path="verification" element={<ManageVerification />} />
      </Route>
    </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontFamily: 'inherit' },
          success: { iconTheme: { primary: '#c9921f', secondary: '#fff' } },
        }}
      />
      <AppRouter />
    </BrowserRouter>
  );
}
