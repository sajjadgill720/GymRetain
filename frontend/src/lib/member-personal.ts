import type { PortalData } from './member-api';

export const PERSONAL_MODE_KEY = 'gymretain_personal_mode';
const STORAGE_KEY = 'gymretain_personal_v1';
type PersonalData = Pick<PortalData, 'workouts' | 'records' | 'measurements'> & {
  version: 1;
  profile: { firstName: string; lastName: string; goal: string; weeklyTarget: number; onboarded: boolean };
};
function empty(): PersonalData {
  return { version: 1, profile: { firstName: 'there', lastName: '', goal: 'Build a routine that fits my life', weeklyTarget: 3, onboarded: false }, workouts: [], records: [], measurements: [] };
}
function text(value: unknown, max: number): string { if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('Enter a valid text value.'); return value.trim(); }
function number(value: unknown, min: number, max: number): number { if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error('Enter a value within the allowed range.'); return value; }
function validate(value: unknown): PersonalData {
  const data = value as PersonalData;
  if (!data || data.version !== 1 || !data.profile || !Array.isArray(data.workouts) || !Array.isArray(data.records) || !Array.isArray(data.measurements)) throw new Error('This is not a GymRetain personal backup.');
  const profile = { firstName: text(data.profile.firstName, 100), lastName: typeof data.profile.lastName === 'string' ? data.profile.lastName.slice(0, 100) : '', goal: text(data.profile.goal, 200), weeklyTarget: number(data.profile.weeklyTarget, 1, 7), onboarded: !!data.profile.onboarded };
  if (!Number.isInteger(profile.weeklyTarget)) throw new Error('Weekly target must be a whole number.');
  const base = (row: { id: string; loggedAt: string }) => { const loggedAt = text(row.loggedAt, 40); if (!Number.isFinite(Date.parse(loggedAt))) throw new Error('Invalid entry date.'); return { id: text(row.id, 100), loggedAt }; };
  if ([data.workouts, data.records, data.measurements].some(rows => rows.length > 10000)) throw new Error('Backup contains too many entries.');
  return { version: 1, profile,
    workouts: data.workouts.map(row => ({ ...base(row), title: text(row.title, 200), minutes: number(row.minutes, 1, 480), notes: typeof row.notes === 'string' ? row.notes.slice(0, 2000) : '' })),
    records: data.records.map(row => ({ ...base(row), exercise: text(row.exercise, 100), weightKg: number(row.weightKg, 0, 1000), reps: number(row.reps, 1, 1000) })),
    measurements: data.measurements.map(row => ({ ...base(row), weightKg: number(row.weightKg, 20, 500), ...(row.waistCm == null ? {} : { waistCm: number(row.waistCm, 20, 300) }) })),
  };
}
function read(): PersonalData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return empty();
  try { return validate(JSON.parse(raw)); } catch { throw new Error('Your saved personal data could not be read. Your saved data has been kept unchanged. Restore a valid backup to continue.'); }
}
function day(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function personalOverview(now = new Date()): PortalData {
  const data = read();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const days = new Set(data.workouts.map(row => day(new Date(row.loggedAt))));
  let streak = 0;
  const cursor = new Date(now);
  if (!days.has(day(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(day(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  const attendanceWeeks = Array.from({ length: 8 }, (_, index) => {
    const start = new Date(monday); start.setDate(start.getDate() - (7 - index) * 7);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    return { label: day(start), visits: data.workouts.filter(row => new Date(row.loggedAt) >= start && new Date(row.loggedAt) < end && new Date(row.loggedAt) <= now).length };
  });
  return { member: { id: 'personal-device', firstName: data.profile.firstName, lastName: data.profile.lastName, memberCode: '', phone: '', status: 'PERSONAL' }, gym: { name: 'Personal mode', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, capacity: 0, insideNow: 0 }, profile: { goal: data.profile.goal, weeklyTarget: data.profile.weeklyTarget, onboarded: data.profile.onboarded, notifications: false, mealChecklist: {} }, streak: { currentStreak: streak, longestStreak: streak, streakFreezeAvailable: 0 }, weeklyVisits: attendanceWeeks[7].visits, totalVisits: data.workouts.length, points: 0, today: day(now), attendanceWeeks, membership: null, rewards: [], rewardRules: [], classes: [], bookings: [], diet: null, workouts: data.workouts, records: data.records, measurements: data.measurements, requests: [], announcements: [], trainer: null, payments: [], onlinePaymentsAvailable: false };
}
export async function personalRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  if (path === '/member/overview' && (!options.method || options.method === 'GET')) return personalOverview();
  const data = read();
  const body = JSON.parse(String(options.body || '{}'));
  const row = { ...body, id: crypto.randomUUID(), loggedAt: new Date().toISOString() };
  if (path === '/member/profile' && options.method === 'PATCH') data.profile = { ...data.profile, ...Object.fromEntries(Object.entries(body).filter(([key]) => ['firstName', 'lastName', 'goal', 'weeklyTarget', 'onboarded'].includes(key))) };
  else if (options.method === 'POST' && path === '/member/workouts') data.workouts.unshift(row);
  else if (options.method === 'POST' && path === '/member/records') data.records.unshift(row);
  else if (options.method === 'POST' && path === '/member/measurements') data.measurements.unshift(row);
  else throw new Error('This service needs a connected gym account. Your personal tracker is available without one.');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validate(data)));
  return row;
}
export function exportPersonal(): string { return localStorage.getItem(STORAGE_KEY) || JSON.stringify(empty()); }
export function takeTrainingWithMe(overview: PortalData): void {
  const data = read();
  if (!localStorage.getItem(STORAGE_KEY)) data.profile = { firstName: overview.member.firstName, lastName: overview.member.lastName, goal: overview.profile.goal, weeklyTarget: overview.profile.weeklyTarget, onboarded: overview.profile.onboarded };
  for (const key of ['workouts', 'records', 'measurements'] as const) {
    const merged = new Map<string, unknown>(data[key].map(row => [row.id, row] as [string, unknown]));
    overview[key].forEach(row => merged.set(row.id, row));
    Object.assign(data, { [key]: [...merged.values()] });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validate(data)));
}
export function importPersonal(raw: string): void {
  if (raw.length > 5_000_000) throw new Error('Backup must be smaller than 5 MB.');
  const data = validate(JSON.parse(raw));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
