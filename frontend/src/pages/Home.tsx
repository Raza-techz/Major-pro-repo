import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  Stethoscope,
  Bed,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-bold mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Next-Gen Multi-Hospital OPD & Resource Optimization</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              MIDFLOW <span className="bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">AI</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Intelligent multi-hospital patient scheduling, server-authoritative OPD queue tokens, real-time bed sanitation management, and explainable waiting-time analytics.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/doctors"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/25 transition gap-2"
              >
                Find Doctors & Book OPD <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/hospitals"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-xs transition"
              >
                Browse Hospitals & Bed Availability
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Multi-Role Portals Showcase */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              One Integrated Healthcare Ecosystem
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Role-tailored dashboards connecting patients, doctors, hospital administrators, and platform overseers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Patient Portal */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Patient Portal</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Doctor directories, time slot reservations, server-authoritative queue tokens, and live waiting-time forecasts.
                </p>
              </div>
              <Link
                to="/patient/appointments"
                className="mt-6 text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                Patient Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Doctor Desk */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Doctor OPD Desk</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Call next patient, start consultations, record prescriptions, advance queues, and protect patient isolation.
                </p>
              </div>
              <Link
                to="/doctor/dashboard"
                className="mt-6 text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                Doctor Workstation <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hospital Admin */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Hospital Operations</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Inpatient bed ward allocations, housekeeping cleaning cycles, doctor roster provisioning, and resource alerts.
                </p>
              </div>
              <Link
                to="/admin/dashboard"
                className="mt-6 text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                Hospital Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Super Admin */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-purple-300 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Super Admin Console</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Accredited hospital onboarding, multi-tenant governance, system audit logs, and network-wide analytics.
                </p>
              </div>
              <Link
                to="/superadmin/dashboard"
                className="mt-6 text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
              >
                Platform Console <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent AI & Security Highlights */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-sky-400">
                  Ethical & Explainable Engineering
                </span>
                <h2 className="text-3xl font-extrabold mt-2 tracking-tight">
                  Transparent Decision Support, Not Black-Box Automation
                </h2>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  MIDFLOW AI prioritizes safety and regulatory alignment for clinical environments:
                </p>
                <div className="mt-6 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Transparent moving-average queue estimation with stated assumptions.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Bed sanitization workflow enforcement: discharged beds undergo cleaning before becoming available.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Strict multi-tenant hospital isolation and server-side RBAC authorization.</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 font-mono text-xs text-slate-300 space-y-2">
                <div className="text-sky-400 font-bold">// Server Authoritative Token Contract</div>
                <div>Token Format: MID-YYYYMMDD-XXX</div>
                <div>Double Booking Protection: ENABLED</div>
                <div>Room Isolation: hospital:id & doctor:id</div>
                <div>Audit Trail: Implemented via AuditLog</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
