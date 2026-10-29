import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusBadge } from './StatusBadge';
import { SURVEY_STATUSES } from '../shared';

const render = (status: (typeof SURVEY_STATUSES)[number]) =>
  renderToStaticMarkup(<StatusBadge status={status} />);

describe('StatusBadge', () => {
  it('me-render label yang benar untuk tiap status', () => {
    expect(render('ONBOARD')).toContain('On Board');
    expect(render('REVIEW')).toContain('Under Review');
    expect(render('REQUEST_REVISE')).toContain('Request Revisi');
    expect(render('REVISED')).toContain('Revised');
    expect(render('REJECTED')).toContain('Rejected');
    expect(render('APPROVED')).toContain('Approved');
  });

  it('memakai kelas warna yang berbeda per status', () => {
    expect(render('ONBOARD')).toContain('bg-blue-100');
    expect(render('REVIEW')).toContain('bg-amber-100');
    expect(render('REQUEST_REVISE')).toContain('bg-orange-100');
    expect(render('REVISED')).toContain('bg-cyan-100');
    expect(render('REJECTED')).toContain('bg-red-100');
    expect(render('APPROVED')).toContain('bg-emerald-100');
  });

  it('mencakup seluruh status tanpa label kosong', () => {
    for (const status of SURVEY_STATUSES) {
      const html = render(status);
      expect(html).toContain('rounded-full');
      expect(html.replace(/<[^>]+>/g, '').trim().length).toBeGreaterThan(0);
    }
  });
});
