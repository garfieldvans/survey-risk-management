import { describe, expect, it } from 'vitest';
import {
  PROTECTION_DETAIL_RULES,
  protectionDetailState,
  protectionGoodLocked,
  type ProtectionType,
} from './protectionLock';

/** Isi seluruh field detail sebuah komponen dengan nilai positif. */
function filled(overrides: Record<string, string> = {}): Record<string, string> {
  const values: Record<string, string> = {};
  for (const type of Object.keys(PROTECTION_DETAIL_RULES) as ProtectionType[]) {
    const rules = PROTECTION_DETAIL_RULES[type];
    for (const key of rules.requiredFields) values[key] = 'isi';
    for (const key of rules.positiveDropdowns) values[key] = 'Ya';
    for (const group of rules.checkboxGroups) values[group[0]] = 'pilihan';
  }
  return { ...values, ...overrides };
}

describe('protectionDetailState', () => {
  it('field kosong → incomplete dan tercantum di missingFields', () => {
    const state = protectionDetailState('detektor', {});
    expect(state.complete).toBe(false);
    expect(state.missingFields.length).toBeGreaterThan(0);
    expect(state.missingFields).toContain('p_det_normal');
    expect(state.hasNegative).toBe(false);
  });

  it('semua field terisi + jawaban positif → complete tanpa jawaban negatif', () => {
    const state = protectionDetailState('hidran', filled());
    expect(state.complete).toBe(true);
    expect(state.missingFields).toEqual([]);
    expect(state.hasNegative).toBe(false);
  });

  it('checkbox group wajib minimal satu terpilih', () => {
    const emptyGroup = filled({ p_det_jenis: '' });
    const state = protectionDetailState('detektor', emptyGroup);
    expect(state.complete).toBe(false);
    expect(protectionDetailState('detektor', filled()).complete).toBe(true);
  });

  it('mengenali "Tidak" / "Tidak Tahu" (case & spasi bebas) sebagai negatif', () => {
    for (const value of ['Tidak', 'tidak', ' TIDAK ', 'Tidak Tahu', 'tidak_tahu', 'TIDAK TAHU']) {
      const state = protectionDetailState('sprinkler', filled({ p_spr_water_same: value }));
      expect(state.hasNegative, `value=${value}`).toBe(true);
    }
  });

  it('jawaban positif tidak dianggap negatif', () => {
    for (const value of ['Ya', 'yes', 'Ada', '']) {
      const state = protectionDetailState('sprinkler', filled({ p_spr_water_same: value }));
      expect(state.hasNegative, `value=${value}`).toBe(false);
    }
  });
});

describe('protectionGoodLocked', () => {
  it('terkunci saat ada jawaban lanjutan negatif', () => {
    expect(protectionGoodLocked('hidran', filled({ p_jockey_auto: 'Tidak' }))).toBe(true);
    expect(protectionGoodLocked('detektor', filled({ p_det_normal: 'Tidak Tahu' }))).toBe(true);
    expect(protectionGoodLocked('sprinkler', filled({ p_spr_water_same: 'Tidak' }))).toBe(true);
  });

  it('tidak terkunci selama tidak ada jawaban negatif', () => {
    expect(protectionGoodLocked('hidran', filled())).toBe(false);
    expect(protectionGoodLocked('detektor', filled())).toBe(false);
    expect(protectionGoodLocked('sprinkler', filled())).toBe(false);
    // field belum terisi pun tidak mengunci — hanya jawaban "Tidak" yang mengunci
    expect(protectionGoodLocked('sprinkler', {})).toBe(false);
  });
});

describe('PROTECTION_DETAIL_RULES', () => {
  it('mengatur hidran/detektor/sprinkler dengan requiredFields terisi', () => {
    expect(Object.keys(PROTECTION_DETAIL_RULES).sort()).toEqual(['detektor', 'hidran', 'sprinkler']);
    for (const type of Object.keys(PROTECTION_DETAIL_RULES) as ProtectionType[]) {
      const rules = PROTECTION_DETAIL_RULES[type];
      expect(rules.requiredFields.length).toBeGreaterThan(0);
      expect(rules.positiveDropdowns.length).toBeGreaterThan(0);
      expect(new Set(rules.requiredFields).size).toBe(rules.requiredFields.length);
    }
  });
});
