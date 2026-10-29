import { useNavigate, useParams } from 'react-router-dom';

export function AdminReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <button type="button" className="btn-secondary" onClick={() => navigate('/admin/reports')}>
        ← Kembali ke Laporan
      </button>

      <div className="card py-16 text-center">
        <p className="text-sm font-medium text-slate-600">Detail Laporan</p>
        <p className="mt-1 text-sm text-slate-400">
          Halaman detail laporan akan menyusul. ID: <code>{id}</code>
        </p>
      </div>
    </div>
  );
}
