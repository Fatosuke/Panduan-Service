/**
 * Tampilkan tanggal/waktu dengan format Indonesia. Nilai baru dari server
 * berupa ISO (2026-10-05T14:30:00.000Z); catatan lama bisa berupa teks
 * seperti "5 Okt 2026, 14.30" - yang bukan ISO ditampilkan apa adanya.
 */
export function formatDateTimeID(value: string | undefined | null): string {
  const v = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}T/.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
