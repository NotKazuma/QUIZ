// Pautan kongsi latihan (gaya Quizizz): buka terus subjek rasmi atau set cikgu,
// dengan bilangan soalan yang dipilih. Dibaca semula dalam App semasa laman dibuka.

// Latihan subjek rasmi: /latihan/<examId>?subjek=<subjectId>&bil=<n>
export function practiceLink({ examId, subjectId, count }) {
  const u = new URL(location.origin + '/latihan/' + encodeURIComponent(examId));
  if (subjectId) u.searchParams.set('subjek', subjectId);
  if (count) u.searchParams.set('bil', String(count));
  return u.toString();
}

// Set soalan cikgu: /?set=<setId>&bil=<n>
export function setLink({ setId, count }) {
  const u = new URL(location.origin + '/');
  u.searchParams.set('set', setId);
  if (count) u.searchParams.set('bil', String(count));
  return u.toString();
}

// Bilik latihan (soalan bank rasmi, boleh jejak): /?bilik=<roomId>
export function roomLink({ roomId }) {
  const u = new URL(location.origin + '/');
  u.searchParams.set('bilik', roomId);
  return u.toString();
}

// Baca parameter kongsi daripada URL semasa. Pulangkan null jika tiada.
export function readShare(search = location.search) {
  const q = new URLSearchParams(search);
  const bil = parseInt(q.get('bil'), 10);
  const count = Number.isFinite(bil) && bil > 0 ? bil : null;
  if (q.get('bilik')) return { kind: 'room', roomId: q.get('bilik') };
  if (q.get('set')) return { kind: 'set', setId: q.get('set'), count };
  if (q.get('subjek')) return { kind: 'subject', subjectId: q.get('subjek'), count };
  return null;
}

// Buang parameter kongsi daripada bar alamat selepas digunakan (supaya refresh tidak ulang).
export function clearShareParams() {
  const u = new URL(location.href);
  ['subjek', 'bil', 'set', 'bilik'].forEach(k => u.searchParams.delete(k));
  history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
}

// Salin pautan ke papan klip, dengan sandaran untuk pelayar lama.
export async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    try {
      const t = document.createElement('textarea');
      t.value = url;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand('copy');
      t.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// Pilihan bilangan soalan yang munasabah untuk jumlah tertentu (null = semua).
export function countOptions(total) {
  return [10, 20, 30, 50].filter(n => n < total);
}
