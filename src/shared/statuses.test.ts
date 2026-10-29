import { describe, expect, it } from 'vitest';
import { GRADE_CATEGORIES, SURVEY_STATUSES, USER_ROLES, type SurveyStatus } from './statuses';

describe('SURVEY_STATUSES', () => {
  it('hanya berisi 6 status baru — status lama sudah hilang', () => {
    expect([...SURVEY_STATUSES]).toEqual([
      'ONBOARD',
      'REVIEW',
      'REQUEST_REVISE',
      'REVISED',
      'REJECTED',
      'APPROVED',
    ]);
    const legacy = ['GRADING', 'DONE', 'CLOSED'];
    for (const s of legacy) {
      expect(SURVEY_STATUSES).not.toContain(s as SurveyStatus);
    }
  });

  it('tanpa duplikat', () => {
    expect(new Set(SURVEY_STATUSES).size).toBe(SURVEY_STATUSES.length);
  });
});

describe('GRADE_CATEGORIES & USER_ROLES', () => {
  it('tetap POOR/MARGINAL/AVERAGE/GOOD', () => {
    expect([...GRADE_CATEGORIES]).toEqual(['POOR', 'MARGINAL', 'AVERAGE', 'GOOD']);
  });

  it('role SURVEYOR dan ADMIN', () => {
    expect([...USER_ROLES]).toEqual(['SURVEYOR', 'ADMIN']);
  });
});
