import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Occupation } from '../api/types';
import { Spinner } from '../components/Spinner';
import { errorMessage } from '../lib/format';

const LEVEL_BADGE: Record<number, string> = {
  1: 'bg-slate-100 text-slate-600',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-violet-100 text-violet-700',
  4: 'bg-pink-100 text-pink-700',
  5: 'bg-amber-100 text-amber-700',
};

export function AdminOccupations() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<Occupation | null>(null);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['occupations'],
    queryFn: async () => {
      const res = await api.get('/occupations');
      return res.data.data.occupations as Occupation[];
    },
  });

  const occupations = data ?? [];

  const { byId, childrenById } = useMemo(() => {
    const byId = new Map<string, Occupation>();
    const cMap = new Map<string, Occupation[]>();
    for (const o of occupations) byId.set(o.id, o);
    for (const o of occupations) {
      if (o.parentId) {
        const list = cMap.get(o.parentId) ?? [];
        list.push(o);
        cMap.set(o.parentId, list);
      }
    }
    for (const list of cMap.values()) list.sort((a, b) => a.code.localeCompare(b.code));
    return { byId, childrenById: cMap };
  }, [occupations]);

  const roots = useMemo(
    () => occupations.filter((o) => !o.parentId).sort((a, b) => a.code.localeCompare(b.code)),
    [occupations],
  );

  // Filter: when active, only render branches leading to a match (auto-expanded).
  const q = filter.trim().toLowerCase();
  const auto = useMemo(() => {
    if (!q) return null;
    const branch = new Set<string>();
    for (const o of occupations) {
      if (o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q)) {
        let cur: Occupation | undefined = o;
        while (cur) {
          branch.add(cur.id);
          cur = cur.parentId ? byId.get(cur.parentId) : undefined;
        }
      }
    }
    return branch;
  }, [q, occupations, byId]);

  const visible = (id: string) => (auto ? auto.has(id) : true);
  const isOpen = (id: string) => (auto ? auto.has(id) : expanded.has(id));

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function showError(err: unknown) {
    setError(errorMessage(err));
    setSuccess('');
    setTimeout(() => setError(''), 4000);
  }
  function showSuccess(msg: string) {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 4000);
  }

  const deleteMutation = useMutation({
    mutationFn: async (o: Occupation) => {
      await api.delete(`/occupations/${o.id}`);
    },
    onSuccess: () => {
      showSuccess('Okupasi dihapus');
      queryClient.invalidateQueries({ queryKey: ['occupations'] });
      queryClient.invalidateQueries({ queryKey: ['questions', 'admin'] });
    },
    onError: (err) => showError(err),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{success}</div>}

      <div className="card p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Master Okupasi (Standar OJK)</h2>
            <p className="text-xs text-slate-400">
              {occupations.length} okupasi. Klik ▼ untuk membuka anak; Edit / Hapus per node.
            </p>
          </div>
          <input
            className="input max-w-xs"
            placeholder="Cari kode / nama..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="max-h-[32rem] space-y-0.5 overflow-y-auto p-3">
          {roots.filter((r) => visible(r.id)).map((root) => (
            <TreeNode
              key={root.id}
              node={root}
              depth={0}
              childrenById={childrenById}
              visible={visible}
              isOpen={isOpen}
              onToggle={toggle}
              onEdit={setEditing}
              onDelete={(o) => {
                if (window.confirm(`Hapus okupasi "${o.code} — ${o.name}"?`)) deleteMutation.mutate(o);
              }}
              deleting={deleteMutation.isPending}
            />
          ))}
          {roots.length === 0 && <div className="py-12 text-center text-sm text-slate-400">Belum ada okupasi.</div>}
          {auto && auto.size === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">Tidak ada okupasi cocok dengan "{filter}".</div>
          )}
        </div>
      </div>

      {editing && (
        <OccupationEditForm
          occupation={editing}
          onCancel={() => setEditing(null)}
          onError={showError}
          onSuccess={(msg) => {
            showSuccess(msg);
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ['occupations'] });
          }}
        />
      )}

      <AddOccupationForm
        roots={roots}
        childrenById={childrenById}
        onError={showError}
        onSuccess={showSuccess}
        onDone={() => queryClient.invalidateQueries({ queryKey: ['occupations'] })}
      />
    </div>
  );
}

function TreeNode({
  node,
  depth,
  childrenById,
  visible,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  deleting,
}: {
  node: Occupation;
  depth: number;
  childrenById: Map<string, Occupation[]>;
  visible: (id: string) => boolean;
  isOpen: (id: string) => boolean;
  onToggle: (id: string) => void;
  onEdit: (o: Occupation) => void;
  onDelete: (o: Occupation) => void;
  deleting: boolean;
}) {
  const children = childrenById.get(node.id) ?? [];
  const open = isOpen(node.id);
  const showChildren = children.length > 0 && open && children.some((c) => visible(c.id));

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
        style={{ marginLeft: depth * 20 }}
      >
        <button
          type="button"
          className={`shrink-0 rounded p-0.5 text-xs text-slate-400 transition ${children.length > 0 ? 'hover:bg-slate-200 hover:text-slate-600' : 'invisible'}`}
          onClick={() => onToggle(node.id)}
          aria-label={open ? 'Tutup' : 'Buka'}
        >
          {children.length > 0 ? (open ? '▾' : '▸') : '·'}
        </button>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${LEVEL_BADGE[node.level] ?? 'bg-slate-100 text-slate-600'}`}>
          L{node.level}
        </span>
        <span className="font-mono text-sm font-semibold text-slate-700">{node.code}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{node.name}</span>
        {children.length > 0 && (
          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
            {children.length}
          </span>
        )}
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="btn-secondary !px-2 !py-0.5 !text-xs"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            disabled={deleting}
            className="btn-danger !px-2 !py-0.5 !text-xs"
          >
            Hapus
          </button>
        </div>
      </div>
      {showChildren &&
        children.map((c) => (
          <TreeNode
            key={c.id}
            node={c}
            depth={depth + 1}
            childrenById={childrenById}
            visible={visible}
            isOpen={isOpen}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            deleting={deleting}
          />
        ))}
    </div>
  );
}

function OccupationEditForm({
  occupation,
  onCancel,
  onError,
  onSuccess,
}: {
  occupation: Occupation;
  onCancel: () => void;
  onError: (err: unknown) => void;
  onSuccess: (msg: string) => void;
}) {
  const [code, setCode] = useState(occupation.code);
  const [name, setName] = useState(occupation.name);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/occupations/${occupation.id}`, { code, name });
      return res.data;
    },
    onSuccess: () => onSuccess(`Okupasi "${code}" diperbarui`),
    onError: (err) => onError(err),
  });

  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">
        Edit Okupasi L{occupation.level} — {occupation.code}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Kode</label>
          <input className="input font-mono" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div>
          <label className="label">Nama</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
        <button
          type="button"
          className="btn-primary"
          disabled={mutation.isPending || !code.trim() || !name.trim()}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
}

function AddOccupationForm({
  roots,
  childrenById,
  onError,
  onSuccess,
  onDone,
}: {
  roots: Occupation[];
  childrenById: Map<string, Occupation[]>;
  onError: (err: unknown) => void;
  onSuccess: (msg: string) => void;
  onDone: () => void;
}) {
  const [level, setLevel] = useState(1);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');

  const allByCode = useMemo(() => {
    const map = new Map<string, Occupation>();
    for (const o of roots) map.set(o.id, o);
    for (const list of childrenById.values()) for (const o of list) map.set(o.id, o);
    return map;
  }, [roots, childrenById]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { code, name, level };
      if (level > 1 && parent) {
        const p = allByCode.get(parent);
        if (p) {
          payload.parentCode = p.code;
          payload.parentLevel = p.level;
        }
      }
      const res = await api.post('/occupations', payload);
      return res.data;
    },
    onSuccess: () => {
      onSuccess('Okupasi berhasil ditambahkan');
      setCode('');
      setName('');
      setParent('');
      onDone();
    },
    onError: (err) => onError(err),
  });

  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">Tambah Okupasi Baru</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Level</label>
          <select className="input" value={level} onChange={(e) => { setLevel(Number(e.target.value)); setParent(''); }}>
            <option value={1}>L1 — Industri</option>
            <option value={2}>L2 — Sub Industri</option>
            <option value={3}>L3 — Jenis Usaha</option>
          </select>
        </div>
        <div>
          <label className="label">Kode</label>
          <input className="input font-mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder={level === 1 ? '20' : level === 2 ? '210' : '21110'} />
        </div>
        <div>
          <label className="label">Nama</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Farmasi" />
        </div>
        <div>
          <label className="label">Parent {level === 1 ? '(tidak ada)' : '(wajib)'}</label>
          {level === 1 ? (
            <div className="input text-slate-400">Kode kepala, tanpa parent</div>
          ) : level === 2 ? (
            <select
              className="input"
              value={parent}
              onChange={(e) => setParent(e.target.value)}
            >
              <option value="">Pilih L1...</option>
              {roots.map((o) => (
                <option key={o.id} value={o.id}>{o.code} — {o.name}</option>
              ))}
            </select>
          ) : (
            <Level2ParentSelect
              roots={roots}
              childrenById={childrenById}
              value={parent}
              onChange={setParent}
            />
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="btn-primary"
          disabled={mutation.isPending || !code.trim() || !name.trim() || (level > 1 && !parent)}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Menyimpan...' : '+ Tambah'}
        </button>
      </div>
    </div>
  );
}

function Level2ParentSelect({
  roots,
  childrenById,
  value,
  onChange,
}: {
  roots: Occupation[];
  childrenById: Map<string, Occupation[]>;
  value: string;
  onChange: (id: string) => void;
}) {
  const [l1, setL1] = useState('');
  const l2 = l1 ? (childrenById.get(l1) ?? []) : [];
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <select className="input" value={l1} onChange={(e) => { setL1(e.target.value); onChange(''); }}>
        <option value="">Pilih L1...</option>
        {roots.map((o) => (
          <option key={o.id} value={o.id}>{o.code} — {o.name}</option>
        ))}
      </select>
      <select className="input" value={value} disabled={!l1} onChange={(e) => onChange(e.target.value)}>
        <option value="">Pilih L2...</option>
        {l2.map((o) => (
          <option key={o.id} value={o.id}>{o.code} — {o.name}</option>
        ))}
      </select>
    </div>
  );
}