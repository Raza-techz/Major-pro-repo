import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Calendar,
  Clock,
  User as UserIcon,
  LogOut,
  Bell,
  Building2,
  Stethoscope,
  Bed,
  ShieldAlert,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import api from '../lib/api';
import { AppNotification } from '../types';
import { getSocket } from '../lib/socket';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const socket = getSocket();
      socket.on('queue:updated', () => {
        fetchNotifications();
      });
      socket.on('queue:doctorUpdate', () => {
        fetchNotifications();
      });

      return () => {
        socket.off('queue:updated');
        socket.off('queue:doctorUpdate');
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Activity className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                MIDFLOW <span className="text-sky-600">AI</span>
              </span>
            </Link>

            {/* Navigation links */}
            <div className="hidden md:flex ml-8 space-x-4">
              <Link
                to="/hospitals"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-sky-600 hover:bg-slate-50 transition"
              >
                Hospitals & OPD
              </Link>
              <Link
                to="/doctors"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-sky-600 hover:bg-slate-50 transition"
              >
                Find Doctors
              </Link>

              {user?.role === 'patient' && (
                <>
                  <Link
                    to="/patient/appointments"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-sky-600 hover:bg-slate-50 transition"
                  >
                    My Appointments
                  </Link>
                  <Link
                    to="/patient/queue"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-sky-600 hover:bg-slate-50 transition"
                  >
                    Live Queue
                  </Link>
                </>
              )}

              {user?.role === 'doctor' && (
                <Link
                  to="/doctor/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 transition flex items-center gap-1.5"
                >
                  <Stethoscope className="w-4 h-4" /> Doctor OPD Desk
                </Link>
              )}

              {user?.role === 'hospital_admin' && (
                <Link
                  to="/admin/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 transition flex items-center gap-1.5"
                >
                  <Building2 className="w-4 h-4" /> Hospital Operations
                </Link>
              )}

              {user?.role === 'super_admin' && (
                <Link
                  to="/superadmin/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-purple-800 bg-purple-50 hover:bg-purple-100 transition flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" /> Platform Super Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-full transition"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-800">In-App Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-sky-600 hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <div
                              key={item._id}
                              onClick={() => handleMarkAsRead(item._id)}
                              className={`p-3 text-sm cursor-pointer transition ${
                                !item.read ? 'bg-sky-50/60 hover:bg-sky-100/60' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-slate-900">{item.title}</span>
                                {!item.read && (
                                  <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600">{item.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(item.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User badge and logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-slate-800">{user.name}</div>
                    <div className="text-[10px] uppercase font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                      {user.role.replace('_', ' ')}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-sky-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/hospitals"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Hospitals & OPD
          </Link>
          <Link
            to="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Find Doctors
          </Link>
          {user?.role === 'patient' && (
            <>
              <Link
                to="/patient/appointments"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                My Appointments
              </Link>
              <Link
                to="/patient/queue"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Live Queue
              </Link>
            </>
          )}
          {user?.role === 'doctor' && (
            <Link
              to="/doctor/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-sky-700 bg-sky-50"
            >
              Doctor OPD Desk
            </Link>
          )}
          {user?.role === 'hospital_admin' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-teal-800 bg-teal-50"
            >
              Hospital Operations
            </Link>
          )}
          {user?.role === 'super_admin' && (
            <Link
              to="/superadmin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-purple-800 bg-purple-50"
            >
              Platform Super Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
