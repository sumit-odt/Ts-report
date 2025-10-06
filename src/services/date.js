export function formatMMDDYYYY(input) {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d?.getTime?.())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

// Backward-compat alias (now formats as mm/dd/yyyy as well)
export function formatMMDDYY(input) {
  return formatMMDDYYYY(input);
}


