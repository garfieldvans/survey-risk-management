import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SurveyHeader } from '../components/survey/SurveyHeader';

// Tema warna selaras apps/api/data/reff.html (navy + gray1)
const NAV_ACTIVE = 'bg-survey-navy text-white';
const NAV_IDLE = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

const NAV_ITEMS = [
  { to: '/surveys', label: 'Survei Saya', end: true },
  { to: '/surveys/new', label: 'Buat Survei Baru', end: false },
];

export function SurveyorLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-survey-g1">
      {/* Header 1:1 .app-header reff.html — pita navy sticky full-width,
          logo "aswata", judul survey, badge 🏢 Property.
          Tombol drawer di kiri via leftSlot. */}
      <div className="no-print">
        <SurveyHeader
          badge="🏢 Property"
          leftSlot={
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-white/85 transition-colors hover:bg-white/10"
              aria-label="Buka menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
            </button>
          }
        />
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-sm font-bold text-slate-800">{user?.name}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Tutup menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive ? NAV_ACTIVE : NAV_IDLE
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-width: header & progress strip full-bleed 1:1 reff.html;
          tiap halaman mengelola container max-w-[900px] sendiri (.main reff). */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
