import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Hospitals } from './pages/Hospitals';
import { Doctors } from './pages/Doctors';
import { PatientAppointments } from './pages/PatientAppointments';
import { PatientQueue } from './pages/PatientQueue';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/doctors" element={<Doctors />} />

              {/* Patient Routes */}
              <Route
                path="/patient/appointments"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor', 'hospital_admin', 'super_admin']}>
                    <PatientAppointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/queue"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor', 'hospital_admin', 'super_admin']}>
                    <PatientQueue />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Routes */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['doctor', 'super_admin']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Hospital Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['hospital_admin', 'super_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Routes */}
              <Route
                path="/superadmin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            <p>MIDFLOW AI — Multi-Hospital Operations, Resource Optimization & Appointment Platform</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Developed as a demonstration & evaluation project with role-based isolation & explainable decision support.
            </p>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
