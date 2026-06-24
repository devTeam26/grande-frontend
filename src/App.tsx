import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppSelector';
import { Toaster } from 'react-hot-toast';
import AOS from "aos";
import 'aos/dist/aos.css';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';
import { Home } from './pages/Home';
import { Chalets } from './pages/Chalets';
import { ChaletDetail } from './pages/ChaletDetail';
import { Booking } from './pages/Booking';
import { Checkout } from './pages/Checkout';
import { Confirmation } from './pages/Confirmation';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/admin/Dashboard';
import { ManageBookings } from './pages/admin/ManageBookings';
import { ManageChalets } from './pages/admin/ManageChalets';
import { ManagePricing } from './pages/admin/ManagePricing';
import { ManageUsers } from './pages/admin/ManageUsers';
import { ManagePromotions } from './pages/admin/ManagePromotions';
import { Brands } from './pages/Brands';
import { Contact } from './pages/Contact';
import { Reviews } from './pages/Reviews';
import { NotFound } from './pages/NotFound';

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
    AOS.refresh();
  }, [location.pathname]);

  return (
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
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/reviews" element={<Reviews />} />
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
      </Route>
    </Routes>
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
