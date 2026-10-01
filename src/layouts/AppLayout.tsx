import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NotificationBell } from '../components/NotificationBell';
import { initialOf } from '../lib/format';

const NAV_ACTIVE = 'bg-brand-600 text-white';
const NAV_IDLE = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

interface NavItem {
  to: string;
  label: string;
  end: boolean;
  title: string;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const location = useLocation();

  const navItems: NavItem[] = isAdmin
    ? [
        { to: '/admin', label: 'Dashboard', end: true, title: 'Dashboard' },
        { to: '/admin/surveys', label: 'Antrian Survey', end: false, title: 'Daftar Survey' },
        { to: '/admin/occupations', label: 'Master Okupasi', end: false, title: 'Master Okupasi' },
        { to: '/admin/questions', label: 'Master Pertanyaan', end: false, title: 'Master Pertanyaan' },
        { to: '/admin/reports', label: 'Laporan', end: false, title: 'Laporan & Ekspor' },
      ]
    : [
        { to: '/surveys', label: 'Survei Saya', end: true, title: 'Survei Saya' },
        { to: '/surveys/new', label: 'Buat Survei Baru', end: false, title: 'Buat Survei Baru' },
      ];

  const title = usePageTitle(location.pathname, navItems);

  return (
    <div className="flex min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 flex w-56 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">A</span>
          <div>
            <div className="text-sm font-bold text-slate-800">SurveyRisK</div>
            <div className="text-[11px] text-slate-400">{isAdmin ? 'Admin Dashboard' : 'Aplikasi Survey'}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? NAV_ACTIVE : NAV_IDLE
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
              {initialOf(user?.name ?? '?')}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800">{user?.name}</div>
              <div className="truncate text-xs text-slate-400">{user?.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            Keluar
          </button>
        </div>
      </aside>

      <div className="ml-56 flex-1">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
          <h1 className="text-base font-semibold text-slate-800">{title}</h1>
          <NotificationBell enabled={true} />
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function usePageTitle(path: string, navItems: NavItem[]): string {
  const match = navItems.find((n) => (n.end ? path === n.to : path.startsWith(n.to)));
  if (match) return match.title;
  // Detail pages (surveys/:id etc.)
  if (path.includes('/surveys/')) return 'Detail Survey';
  return navItems[0].title;
}