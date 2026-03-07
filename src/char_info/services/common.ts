export function hasText(val: unknown): boolean {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s !== '' && s !== 'null' && s !== 'none' && s !== '[]';
}

export function hasArrayContent(arr: unknown): arr is unknown[] {
  return Array.isArray(arr) && arr.length > 0;
}

export function parseAttributeValue(val: unknown): number {
  if (val === undefined || val === null) return 0;
  const str = String(val).trim();
  if (str.includes('=')) {
    const parts = str.split('=');
    const lastPart = parts[parts.length - 1].trim();
    return parseInt(lastPart, 10) || 0;
  }
  return parseInt(str, 10) || 0;
}

export function getSmartArray(input: unknown): string[] {
  if (input === undefined || input === null) return [];
  if (Array.isArray(input)) {
    return input.map(item => String(item ?? '').trim()).filter(Boolean);
  }

  const str = String(input).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'none') return [];

  let processed = str.replace(/\]\s*\[/g, '], [');
  processed = processed.replace(/^[\s\["']+|[\s\]"']+$/g, '');
  const items = processed.split(/[,;|，；、]/);

  return items.map(s => s.trim().replace(/^["'\[\(]+|["'\]\)]+$/g, '')).filter(s => s && s !== 'null');
}

export function escapeHtml(str: unknown): string {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
