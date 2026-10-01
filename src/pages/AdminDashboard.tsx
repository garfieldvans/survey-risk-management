import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DashboardStats, Survey } from '../api/types';
import { Spinner } from '../components/Spinner';
import { formatDate } from '../lib/format';
import { labelOfCategory } from '../shared';

const STATUS_LABELS: Record<string, string> = {
  ONBOARD: 'On Board',
  REVIEW: 'Review',
  GRADING: 'Grading',
  DONE: 'Done',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
};

const STATUS_COLORS: Record<string, string> = {
  ONBOARD: 'border-blue-500 bg-blue-50',
  REVIEW: 'border-amber-500 bg-amber-50',
  GRADING: 'border-purple-500 bg-purple-50',
  DONE: 'border-emerald-500 bg-emerald-50',
  CLOSED: 'border-slate-400 bg-slate-50',
  REJECTED: 'border-red-500 bg-red-50',
};

const CATEGORY_BADGE: Record<string, string> = {
  POOR: 'bg-red-100 text-red-700',
  MARGINAL: 'bg-amber-100 text-amber-700',
  AVERAGE: 'bg-blue-100 text-blue-700',
  GOOD: 'bg-emerald-100 text-emerald-700',
};

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await api.get('/stats');
      return res.data.data.stats as DashboardStats;
    },
  });

  const { data: surveys, isLoading: surveysLoading } = useQuery({
    queryKey: ['surveys', 'onboard'],
    queryFn: async () => {
      const res = await api.get('/surveys', { params: { status: 'ONBOARD' } });
      return res.data.data.surveys as Survey[];
    },
  });

  if (statsLoading || surveysLoading) return <Spinner />;

  const distribution = stats?.distribution ?? { GOOD: 0, AVERAGE: 0, MARGINAL: 0, POOR: 0 };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          ⬇ Export Report
        </Link>
      </div>

      {/* Stat cards — gaya BORAS: ikon bulat di kanan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Properti"
          value={String(stats?.totalProperties ?? 0)}
          icon="🏢"
          iconClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Properti Risiko Tinggi"
          value={String(stats?.highRisk ?? 0)}
          icon="⚠️"
          iconClass="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Rata-rata Skor"
          value={stats?.avgScore != null ? `${stats.avgScore}` : '—'}
          icon="📊"
          iconClass="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Kategori POOR"
          value={String(stats?.critical ?? 0)}
          icon="🚨"
          iconClass="bg-red-100 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Risk Distribution — donut via conic-gradient */}
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800">Distribusi Risk Grading</h3>
          <DonutChart distribution={distribution} />
        </div>

        {/* Building Rankings (Top Risk) */}
        <div className="card">
          <h3 className="mb-3 text-base font-semibold text-slate-800">Peringkat Properti (Skor Terendah)</h3>
          {(stats?.rankings ?? []).length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Belum ada properti dengan grading.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">Properti</th>
                    <th className="py-2 pr-3 font-semibold">Risk Level</th>
                    <th className="py-2 pr-3 font-semibold">Skor</th>
                    <th className="py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(stats?.rankings ?? []).map((r) => (
                    <tr key={r.surveyId} className="transition-colors hover:bg-slate-50">
                      <td className="py-2.5 pr-3">
                        <Link to={`/admin/surveys/${r.surveyId}`} className="font-medium text-slate-800 hover:text-brand-600 hover:underline">
                          {r.name}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_BADGE[r.category]}`}>{labelOfCategory(r.category).toUpperCase()}</span>
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-slate-700">{r.score}</td>
                      <td className="py-2.5 text-slate-500">{STATUS_LABELS[r.status] ?? r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status pipeline — kartu status tetap dipertahankan untuk navigasi cepat */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Status Pipeline</h3>
          <Link to="/admin/surveys" className="text-sm font-medium text-brand-600 hover:underline">Lihat semua →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(stats?.byStatus ?? []).map((s) => (
            <Link
              key={s.status}
              to={`/admin/surveys?status=${s.status}`}
              className={`card cursor-pointer border-l-4 transition-colors hover:shadow-md ${STATUS_COLORS[s.status] ?? 'border-slate-300 bg-white'}`}
            >
              <div className="text-2xl font-bold text-slate-800">{s.count}</div>
              <div className="text-xs font-medium text-slate-500">{STATUS_LABELS[s.status] ?? s.status}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ONBOARD queue */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Antrian Survey Baru (ONBOARD)</h3>
          <Link to="/admin/surveys" className="text-sm font-medium text-brand-600 hover:underline">Lihat semua →</Link>
        </div>
        {(!surveys || surveys.length === 0) ? (
          <div className="card py-10 text-center text-sm text-slate-400">Tidak ada survey baru saat ini</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Okupasi</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surveys.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{s.property.name}</div>
                      <div className="text-xs text-slate-400">{s.property.ownerName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.property.occupation?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/surveys/${s.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  icon: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="text-xs font-medium text-slate-400">{label}</div>
        <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
      </div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-full text-lg ${iconClass}`}>{icon}</span>
    </div>
  );
}

/**
 * Donut chart tanpa library: conic-gradient + lubang tengah via mask radial.
 * Warna: HIGH-ish MARGINAL/POOR merah, AVERAGE oranye, GOOD hijau — mengikuti
 * gaya gambar (merah/oranye/hijau) dipetakan ke 4 kategori grading.
 */
function DonutChart({ distribution }: { distribution: Record<'GOOD' | 'AVERAGE' | 'MARGINAL' | 'POOR', number> }) {
  const entries: Array<{ key: keyof typeof distribution; color: string; label: string }> = [
    { key: 'POOR', color: '#EF4444', label: 'POOR' },
    { key: 'MARGINAL', color: '#F59E0B', label: 'MARGINAL' },
    { key: 'AVERAGE', color: '#FBBF24', label: 'AVERAGE' },
    { key: 'GOOD', color: '#22C55E', label: 'GOOD' },
  ];
  const total = entries.reduce((sum, e) => sum + distribution[e.key], 0);

  if (total === 0) {
    return <div className="py-16 text-center text-sm text-slate-400">Belum ada data grading.</div>;
  }

  // Build conic-gradient stops
  let acc = 0;
  const stops: string[] = [];
  for (const e of entries) {
    const share = distribution[e.key] / total;
    if (share === 0) continue;
    const from = acc * 360;
    acc += share;
    const to = acc * 360;
    stops.push(`${e.color} ${from}deg ${to}deg`);
  }
  const gradient = `conic-gradient(${stops.join(', ')})`;

  return (
    <div className="flex flex-col items-center py-4">
      <div
        className="h-48 w-48 rounded-full"
        style={{
          background: gradient,
          WebkitMask: 'radial-gradient(circle, transparent 58%, black 59%)',
          mask: 'radial-gradient(circle, transparent 58%, black 59%)',
        }}
      />
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
        {entries.map((e) => (
          <span key={e.key} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: e.color }} />
            {e.label} <span className="font-normal text-slate-400">({distribution[e.key]})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
