import { describe, expect, it } from 'vitest';
import {
  errorMessage,
  formatBytes,
  formatDate,
  formatDateTime,
  formatRp,
  groupDigits,
  initialOf,
} from './format';

describe('formatDate / formatDateTime', () => {
  it('null/undefined → "-".', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
    expect(formatDateTime(null)).toBe('-');
  });

  it('ISO → tanggal Indonesia (bulan pendek + tahun)', () => {
    const d = formatDate('2026-01-15T00:00:00.000Z');
    expect(d).toContain('2026');
    expect(d).toContain('Jan');
    expect(d).not.toBe('-');
  });

  it('formatDateTime menyertakan jam', () => {
    const dt = formatDateTime('2026-01-15T08:30:00.000Z');
    expect(dt).toContain('2026');
    expect(dt).toMatch(/\d{2}[.:]\d{2}/);
  });
});

describe('formatBytes', () => {
  it('B / KB / MB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
    expect(formatBytes(2621440)).toBe('2.5 MB');
  });
});

describe('groupDigits / formatRp', () => {
  it('memisah ribuan dengan koma', () => {
    expect(groupDigits('1234567')).toBe('1,234,567');
    expect(groupDigits(1000)).toBe('1,000');
    expect(groupDigits('0')).toBe('0');
  });

  it('mengabaikan non-digit dan menangani nilai kosong', () => {
    expect(groupDigits('')).toBe('');
    expect(groupDigits('abc')).toBe('');
    expect(groupDigits(null)).toBe('');
    expect(groupDigits(undefined)).toBe('');
    expect(groupDigits('Rp 1.234.567')).toBe('1,234,567');
  });

  it('pemisah kustom', () => {
    expect(groupDigits('1234', '.')).toBe('1.234');
  });

  it('formatRp menambahkan prefix Rp', () => {
    expect(formatRp(1000000)).toBe('Rp 1,000,000');
    expect(formatRp('500000')).toBe('Rp 500,000');
    expect(formatRp(null)).toBe('');
    expect(formatRp('')).toBe('');
  });
});

describe('errorMessage', () => {
  it('tanpa response = API tidak terhubung', () => {
    expect(errorMessage({ message: 'Network Error' })).toBe(
      'Tidak dapat terhubung ke server. Pastikan API sudah berjalan.',
    );
  });

  it('memakai { error } dari body API', () => {
    expect(errorMessage({ response: { status: 400, data: { error: 'Transisi tidak valid' } } })).toBe(
      'Transisi tidak valid',
    );
  });

  it('fallback ke { message } dari body API', () => {
    expect(errorMessage({ response: { status: 422, data: { message: 'Zod gagal' } } })).toBe('Zod gagal');
  });

  it('502/503/504 → pesan server tersedia', () => {
    for (const status of [502, 503, 504]) {
      expect(errorMessage({ response: { status } })).toBe('Server tidak tersedia. Coba beberapa saat lagi.');
    }
  });

  it('status lain → pesan berisi kode status', () => {
    expect(errorMessage({ response: { status: 500 } })).toBe('Terjadi kesalahan (500)');
    expect(errorMessage({ response: { status: 404 } })).toBe('Terjadi kesalahan (404)');
  });

  it('fallback terakhir: pesan error / teks default', () => {
    expect(errorMessage({ message: 'timeout of 10000ms exceeded' })).toBe(
      'Tidak dapat terhubung ke server. Pastikan API sudah berjalan.',
    );
    expect(errorMessage({})).toBe('Terjadi kesalahan');
    expect(errorMessage(null)).toBe('Terjadi kesalahan');
  });
});

describe('initialOf', () => {
  it('mengambil maksimal 2 huruf depan, kapital', () => {
    expect(initialOf('Buffy Summers')).toBe('BS');
    expect(initialOf('madonna')).toBe('M');
    expect(initialOf('  adira  pratama  ')).toBe('AP');
    expect(initialOf('')).toBe('');
  });
});
