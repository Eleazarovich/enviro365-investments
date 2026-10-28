const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Locale-independent formatting to keep server and client output identical
export function formatRand(value: number, withCents = false): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const fixed = withCents ? abs.toFixed(2) : Math.round(abs).toString();
  const [whole, cents] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}R${grouped}${cents ? `.${cents}` : ''}`;
}

export function formatRandPrecise(value: number): string {
  // Whole amounts show no cents, fractional amounts show two decimals
  return formatRand(value, !Number.isInteger(value));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate().toString().padStart(2, '0');
  return `${day} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const mm = d.getUTCMinutes().toString().padStart(2, '0');
  return `${formatDate(iso)}, ${hh}:${mm}`;
}

export function statusLabel(status: string): string {
  if (status === 'SUBMITTED') return 'Submitted';
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function productTypeLabel(type: string): string {
  return type === 'RETIREMENT' ? 'Retirement' : 'General investment';
}
