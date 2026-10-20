export function memberHref(path: string, preview: boolean): string {
  const url = new URL(path, 'https://gymretain.local');
  if (preview) url.searchParams.set('preview', '1');
  return `${url.pathname}${url.search}${url.hash}`;
}

export function memberNavSection(pathname: string): string {
  if (pathname === '/portal') return 'home';
  if (['/portal/workouts', '/portal/classes'].includes(pathname)) return 'workouts';
  if (pathname === '/portal/progress') return 'progress';
  if (pathname === '/portal/rewards') return 'rewards';
  return 'account';
}

export function crowdStatus(inside: number, capacity: number) {
  if (capacity <= 0) return { label: 'Capacity unavailable', fraction: 0, tone: 'neutral' };
  const fraction = Math.max(0, inside / capacity);
  return {
    label: fraction >= 1 ? 'At capacity' : fraction >= 0.8 ? 'Getting busy' : 'Room to move',
    fraction: Math.min(1, fraction),
    tone: fraction >= 1 ? 'danger' : fraction >= 0.8 ? 'warning' : 'success',
  };
}
