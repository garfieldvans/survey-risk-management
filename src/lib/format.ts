export function formatDate(iso?: string | null): string {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function errorMessage(err: unknown): string {
  // API mengirim error sebagai { error: string } (lihat setErrorHandler di server.ts),
  // zod validation sebagai { message: string }.
  const anyErr = err as {
    response?: { status?: number; data?: { error?: string; message?: string } };
    message?: string;
  };

  // Tidak ada response = request tidak pernah sampai ke server
  // (API mati, koneksi putus, timeout).
  if (anyErr?.response === undefined && anyErr?.message) {
    return 'Tidak dapat terhubung ke server. Pastikan API sudah berjalan.';
  }

  const data = anyErr?.response?.data;
  if (data?.error) return data.error;
  if (data?.message) return data.message;

  // Response tanpa body yang dikenal — mis. 502 dari proxy dev saat backend mati.
  const status = anyErr?.response?.status;
  if (status === 502 || status === 503 || status === 504) {
    return 'Server tidak tersedia. Coba beberapa saat lagi.';
  }
  if (status) return `Terjadi kesalahan (${status})`;
  return anyErr?.message ?? 'Terjadi kesalahan';
}

export function initialOf(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}