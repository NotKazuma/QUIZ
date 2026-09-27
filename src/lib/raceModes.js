// Mod perlumbaan & susunan kedudukan (tulen — dikongsi oleh laman dan Cloudflare Worker).
//   klasik     — semua jawab ikut kelajuan sendiri; mata tertinggi menang.
//   kalah-mati — setiap pemain ada beberapa nyawa; salah/lambat hilang satu; pemain terakhir hidup menang.
//   pasukan    — pemain dalam pasukan berwarna; purata mata pasukan tertinggi menang.

export const MODES = [
  { id: 'klasik', name: 'Klasik', emoji: '🏁', desc: 'Jawab pantas & tepat — mata tertinggi menang.' },
  { id: 'kalah-mati', name: 'Kalah Mati', emoji: '💀', desc: 'Salah atau lambat hilang nyawa. Pemain terakhir yang hidup menang!' },
  { id: 'pasukan', name: 'Pasukan', emoji: '🤝', desc: 'Main dalam pasukan — purata mata pasukan tertinggi menang.' },
];
export const modeOf = race => MODES.find(m => m.id === race?.mode) || MODES[0];

export const TEAMS = [
  { id: 'merah', name: 'Merah', color: '#ff4b4b', emoji: '🔴' },
  { id: 'biru', name: 'Biru', color: '#1cb0f6', emoji: '🔵' },
  { id: 'hijau', name: 'Hijau', color: '#58cc02', emoji: '🟢' },
  { id: 'kuning', name: 'Kuning', color: '#ffc800', emoji: '🟡' },
];
export const teamsFor = race => TEAMS.slice(0, Math.min(4, Math.max(2, race?.teamCount || 2)));
export const teamById = id => TEAMS.find(t => t.id === id);

const rows = players => Object.entries(players || {}).map(([uid, p]) => ({ uid, ...p }));
const byScore = (a, b) => (b.score || 0) - (a.score || 0) || (b.correct || 0) - (a.correct || 0) || (a.joinedAt || 0) - (b.joinedAt || 0);

// Susunan kedudukan pemain mengikut mod.
export function ranking(players = {}, race = null) {
  const list = rows(players);
  if (race?.mode === 'kalah-mati') {
    // Yang masih hidup dahulu (lebih banyak nyawa), kemudian yang bertahan paling lama.
    return list.sort((a, b) => Number(Boolean(a.out)) - Number(Boolean(b.out))
      || (b.lives || 0) - (a.lives || 0) || (b.answered || 0) - (a.answered || 0) || byScore(a, b));
  }
  return list.sort(byScore);
}

// Kedudukan pasukan: purata mata ahli (adil walaupun saiz pasukan berbeza).
export function teamStandings(players = {}, race = null) {
  const list = rows(players);
  return teamsFor(race)
    .map(team => {
      const members = list.filter(p => p.team === team.id);
      const total = members.reduce((n, p) => n + (p.score || 0), 0);
      return { team, members, total, avg: members.length ? Math.round(total / members.length) : 0 };
    })
    .sort((a, b) => b.avg - a.avg || b.total - a.total);
}

// Pasukan dengan ahli paling sedikit (untuk pemain baharu).
export function pickTeam(players = {}, race = null) {
  const list = rows(players);
  const counts = teamsFor(race).map(t => ({ id: t.id, n: list.filter(p => p.team === t.id).length }));
  const min = Math.min(...counts.map(c => c.n));
  const options = counts.filter(c => c.n === min);
  return options[Math.floor(Math.random() * options.length)].id;
}

export const aliveCount = players => rows(players).filter(p => !p.out).length;

// Hos tamatkan perlumbaan: semua selesai, atau (Kalah Mati) tinggal seorang sahaja yang hidup.
export function shouldEnd(race) {
  const list = rows(race?.players);
  if (!list.length) return false;
  if (list.every(p => p.finished)) return true;
  return race.mode === 'kalah-mati' && list.length >= 2 && aliveCount(race.players) <= 1;
}

// Kedudukan pemain untuk ganjaran (pasukan: ahli pasukan menang dikira tempat pertama).
export function rewardRank(race, uid) {
  const me = race?.players?.[uid];
  if (!me) return null;
  const players = Object.keys(race.players).length;
  if (race.mode === 'pasukan') {
    const standings = teamStandings(race.players, race);
    const place = standings.findIndex(s => s.team.id === me.team) + 1;
    return { rank: place || players, players };
  }
  return { rank: ranking(race.players, race).findIndex(r => r.uid === uid) + 1, players };
}
