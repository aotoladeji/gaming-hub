import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import ManageBookingPage from './pages/ManageBookingPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import VideoBackground from './components/VideoBackground';

export default function App() {
  return (
    <BrowserRouter>
      <VideoBackground />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/book/:gameId" element={<BookingPage />} />
        <Route path="/manage" element={<ManageBookingPage />} />
        {/* Staff/Super Admin sign-in lives at /login — intentionally not linked from the
            public landing page. Go to it directly, e.g. http://localhost:3000/login */}
        <Route path="/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/super"
          element={
            <ProtectedRoute requireSuperAdmin>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
