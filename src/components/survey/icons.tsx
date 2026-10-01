export type SurveyIconName =
  | 'clipboard'
  | 'compass'
  | 'target'
  | 'paperclip'
  | 'briefcase'
  | 'construction'
  | 'factory'
  | 'flame'
  | 'globe'
  | 'volcano'
  | 'coins'
  | 'chart'
  | 'list'
  | 'camera'
  | 'map'
  | 'document'
  | 'pin'
  | 'trash'
  | 'plus'
  | 'check'
  | 'x';

const PATHS: Record<SurveyIconName, string[]> = {
  clipboard: [
    'M9 4h6v3H9z',
    'M9 5.5H6.5A1.5 1.5 0 0 0 5 7v12a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V7a1.5 1.5 0 0 0-1.5-1.5H15',
    'M9 12h6',
    'M9 16h4',
  ],
  compass: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M15.5 8.5l-2 5-5 2 2-5 5-2z'],
  target: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z',
    'M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  ],
  paperclip: [
    'M20.5 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8',
  ],
  briefcase: [
    'M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z',
    'M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
    'M3 13h18',
  ],
  construction: ['M4 21V8l7-4v17', 'M11 10h9v11', 'M14.5 14h2', 'M14.5 18h2'],
  factory: ['M3 21h18', 'M4 21V10l5 3v-3l5 3V7l6 4v10'],
  flame: [
    'M12 3c1.6 3.2 4.5 4.6 4.5 8.4A4.5 4.5 0 0 1 12 16a4.5 4.5 0 0 1-4.5-4.6c0-1.7.8-2.8 1.9-4',
    'M12 21a6 6 0 0 0 6-6',
  ],
  globe: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    'M3 12h18',
    'M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
  ],
  volcano: ['M3 20h18', 'M13.5 6l4.5 14', 'M10.5 6L6 20', 'M9 6h6l3-3'],
  coins: [
    'M12 8c3.9 0 7-1.3 7-3s-3.1-3-7-3-7 1.3-7 3 3.1 3 7 3z',
    'M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5',
    'M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6',
  ],
  chart: ['M4 4v16h16', 'M8 16V9', 'M13 16v-4', 'M18 16v-8'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3.5 6h.01', 'M3.5 12h.01', 'M3.5 18h.01'],
  camera: [
    'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z',
    'M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  ],
  map: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v14', 'M15 6v14'],
  document: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z', 'M14 3v5h5'],
  pin: ['M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z', 'M12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  trash: ['M4 7h16', 'M9 7V5h6v2', 'M6 7l1 13h10l1-13'],
  plus: ['M12 5v14', 'M5 12h14'],
  check: ['M4 12.5l5 5L20 6.5'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
};

export function SurveyIcon({ name, className = 'h-5 w-5' }: { name: SurveyIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
