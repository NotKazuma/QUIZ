// Alamat setiap halaman, cth. kuiz.kazumadigital.net/kedai. Skrin ↔ laluan URL.
export const ROUTES = {
  home: '/utama',
  path: '/latihan',          // + /<id peperiksaan>
  quiz: '/kuiz',
  challenge: '/cabaran',
  result: '/keputusan',
  achievements: '/lencana',
  classes: '/kelas',
  teacher: '/cikgu',
  'apply-teacher': '/mohon-cikgu',
  admin: '/admin',
  race: '/lumba',
  games: '/main',
  profile: '/profil',
  avatar: '/avatar',
  shop: '/kedai',
};

// Skrin yang perlukan data sesi — jika dibuka terus (refresh), kembali ke Utama.
export const NEEDS_STATE = ['quiz', 'challenge', 'result'];

export function pathFor(screen, examId) {
  const p = ROUTES[screen] || ROUTES.home;
  return screen === 'path' && examId ? `${p}/${encodeURIComponent(examId)}` : p;
}

// Pulangkan { screen, examId } daripada laluan semasa.
export function parsePath(pathname = location.pathname) {
  const [, first = '', second] = pathname.split('/');
  const screen = Object.keys(ROUTES).find(k => ROUTES[k] === '/' + first) || 'home';
  return { screen, examId: screen === 'path' && second ? decodeURIComponent(second) : null };
}
