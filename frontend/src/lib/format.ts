export function formatMW(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }
  return `${Math.round(val).toLocaleString('en-GB')} MW`;
}

export function formatSignedMW(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }
  const sign = val > 0 ? '+' : '';
  return `${sign}${Math.round(val).toLocaleString('en-GB')} MW`;
}

export function formatUKDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' GMT';
}

export function formatUKTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function formatUKDate(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'matched':
      return {
        label: 'Matched',
        className: 'badge-matched'
      };
    case 'no_eligible_forecast':
      return {
        label: 'No Forecast Available',
        className: 'badge-no-forecast'
      };
    case 'missing_actual':
      return {
        label: 'Missing Actual',
        className: 'badge-missing-actual'
      };
    case 'missing_both':
      return {
        label: 'Missing Both',
        className: 'badge-missing-both'
      };
    default:
      return {
        label: status,
        className: 'badge-default'
      };
  }
}
