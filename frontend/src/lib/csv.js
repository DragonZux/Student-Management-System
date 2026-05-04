function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';

  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;

  return `"${text.replace(/"/g, '""')}"`;
}

export function exportToCSV(rows, filename = 'export.csv') {
  if (typeof window === 'undefined') return;

  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) return;

  const headers = Object.keys(list[0]);
  const lines = [
    headers.map(escapeCsvValue).join(','),
    ...list.map((row) => headers.map((key) => escapeCsvValue(row[key])).join(',')),
  ];

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
