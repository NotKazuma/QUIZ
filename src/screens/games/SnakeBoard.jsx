// Papan Ular & Tangga 6×6: petak, tangga & ular (SVG) dan token pemain. Dikongsi mod solo & dalam talian.
import { useMemo } from 'react';
import { motion } from 'motion/react';
import AnimalAvatar from '../../components/AnimalAvatar.jsx';
import Emoji from '../../components/Emoji.jsx';
import Mascot from '../../components/Mascot.jsx';

export const SIZE = 6;
export const LAST = SIZE * SIZE;
const SNAKE_COLORS = ['#58cc02', '#ce82ff', '#ff9600', '#1cb0f6', '#ff4b4b'];

// Tema papan (dipilih secara rawak setiap permainan).
export const THEMES = {
  padang: { name: 'Padang', a: '#fff4d6', b: '#ffe3a3', border: '#b07a3c', shade: '#7a5226', text: 'rgb(0 0 0 / 0.45)' },
  pantai: { name: 'Pantai', a: '#e3f6ff', b: '#bfe8ff', border: '#2f8fc9', shade: '#1c5f87', text: 'rgb(0 40 80 / 0.5)' },
  hutan: { name: 'Hutan', a: '#e8f8d8', b: '#c9ecaa', border: '#4f8f2a', shade: '#2f5e16', text: 'rgb(0 50 0 / 0.5)' },
  gula: { name: 'Gula-gula', a: '#ffe6f3', b: '#ffc9e4', border: '#c05a9a', shade: '#8a3a6c', text: 'rgb(90 0 50 / 0.5)' },
  angkasa: { name: 'Angkasa', a: '#343a72', b: '#262b5c', border: '#7a6cff', shade: '#3a2f99', text: 'rgb(255 255 255 / 0.6)' },
};
// Petak istimewa: bintang = main sekali lagi; ais = terlepas giliran seterusnya; kotak = dapat kad kuasa.
export const SPECIALS = {
  bintang: { emoji: '⭐', text: 'Petak bintang — main sekali lagi!' },
  ais: { emoji: '🧊', text: 'Petak ais — beku, terlepas giliran seterusnya!' },
  kotak: { emoji: '🎁', text: 'Kotak kuasa — dapat satu kad kuasa!' },
};

// Jana susun atur rawak: 3–5 tangga, 3–5 ular, 2–3 petak istimewa & tema — setiap permainan berbeza.
export function generateLayout(rand = Math.random) {
  const pick = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  const rowOf = n => Math.floor((n - 1) / SIZE);
  const colOf = n => cellXY(n).x;
  // Tangga/ular merentas 1–2 baris dan tidak terlalu condong supaya papan kekal kemas.
  const tidy = (a, b) => rowOf(a) !== rowOf(b) && Math.abs(rowOf(a) - rowOf(b)) <= 2 && Math.abs(colOf(a) - colOf(b)) <= 2;
  const used = new Set([1, LAST]);
  const ladders = {}, snakes = {}, specials = {};
  const want = { l: pick(3, 4), s: pick(3, 4), x: pick(3, 4) };
  for (let guard = 0; Object.keys(ladders).length < want.l && guard < 600; guard++) {
    const a = pick(2, LAST - SIZE - 1);
    const b = pick(a + SIZE - 2, Math.min(LAST - 1, a + SIZE * 2 + 2));
    if (used.has(a) || used.has(b) || !tidy(a, b)) continue;
    ladders[a] = b; used.add(a); used.add(b);
  }
  for (let guard = 0; Object.keys(snakes).length < want.s && guard < 600; guard++) {
    const head = pick(SIZE + 2, LAST - 1);
    const tail = pick(Math.max(2, head - SIZE * 2 - 2), head - SIZE + 2);
    if (used.has(head) || used.has(tail) || !tidy(head, tail)) continue;
    snakes[head] = tail; used.add(head); used.add(tail);
  }
  for (let guard = 0; Object.keys(specials).length < want.x && guard < 200; guard++) {
    const n = pick(4, LAST - 2);
    if (used.has(n)) continue;
    const roll = rand();
    specials[n] = roll < 0.4 ? 'kotak' : roll < 0.7 ? 'bintang' : 'ais';
    used.add(n);
  }
  const themes = Object.keys(THEMES);
  return { ladders, snakes, specials, theme: themes[pick(0, themes.length - 1)] };
}

// Kedudukan tengah petak n (1..36) dalam unit petak; baris bawah = 1..6 (kiri→kanan), berzigzag.
export function cellXY(n) {
  const i = Math.max(1, Math.min(LAST, n)) - 1;
  const row = Math.floor(i / SIZE);
  const col = row % 2 === 0 ? i % SIZE : SIZE - 1 - (i % SIZE);
  return { x: col + 0.5, y: SIZE - 1 - row + 0.5 };
}


// Hitung laluan: petak mendarat (maks LAST) dan petak akhir selepas tangga/ular.
export function moveResult(from, steps, layout) {
  const land = Math.min(LAST, from + steps);
  const up = layout?.ladders?.[land], down = layout?.snakes?.[land];
  const to = up || down || land;
  return { land, to, via: up ? 'tangga' : down ? 'ular' : null, special: layout?.specials?.[to] || null };
}

// players: [{ pos, avatar, color, bot }]; layout = generateLayout(); turn = indeks pemain yang sedang bermain (-1 = tiada).
export default function SnakeBoard({ players, turn, layout }) {
  const LADDERS = layout?.ladders || {};
  const SNAKES = layout?.snakes || {};
  const SPECIALS_AT = layout?.specials || {};
  const theme = THEMES[layout?.theme] || THEMES.padang;
  const board = useMemo(() => Array.from({ length: LAST }, (_, k) => {
    // Susun petak dari atas ke bawah untuk grid CSS.
    const row = SIZE - 1 - Math.floor(k / SIZE);
    const colInRow = k % SIZE;
    const n = row * SIZE + (row % 2 === 0 ? colInRow + 1 : SIZE - colInRow);
    return n;
  }), []);
  const fx = (n, dx = 0, dy = 0) => { const { x, y } = cellXY(n); return { x: x + dx, y: y + dy }; };

  return (
    <div className="snake-board" style={{ '--sa': theme.a, '--sb': theme.b, '--sborder': theme.border, '--sshade': theme.shade, '--stext': theme.text }}>
      <div className="snake-grid">
        {board.map(n => (
          <div key={n} className={'snake-cell' + (n % 2 ? ' is-odd' : '') + (n === LAST ? ' is-goal' : '') + (LADDERS[n] ? ' is-ladder' : '') + (SNAKES[n] ? ' is-snake' : '')}>
            <span>{n === LAST ? <Emoji e="🏁" size="1.6rem" /> : n}</span>
            {SPECIALS_AT[n] && <span className="snake-special"><Emoji e={SPECIALS[SPECIALS_AT[n]].emoji} size="1.5rem" /></span>}
          </div>
        ))}
      </div>
      <svg className="snake-art" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        {Object.entries(LADDERS).map(([a, b]) => {
          const p = fx(+a), r = fx(+b);
          const ang = Math.atan2(r.y - p.y, r.x - p.x);
          const ox = Math.sin(ang) * 0.14, oy = -Math.cos(ang) * 0.14;
          const len = Math.hypot(r.x - p.x, r.y - p.y);
          const rungs = Math.max(2, Math.round(len * 2.4));
          return (
            <g key={'l' + a} className="ladder">
              <line x1={p.x + ox} y1={p.y + oy} x2={r.x + ox} y2={r.y + oy} />
              <line x1={p.x - ox} y1={p.y - oy} x2={r.x - ox} y2={r.y - oy} />
              {Array.from({ length: rungs }, (_, k) => {
                const t = (k + 0.5) / rungs;
                const cx = p.x + (r.x - p.x) * t, cy = p.y + (r.y - p.y) * t;
                return <line key={k} className="rung" x1={cx + ox} y1={cy + oy} x2={cx - ox} y2={cy - oy} />;
              })}
            </g>
          );
        })}
        {Object.entries(SNAKES).map(([a, b], k) => {
          const h = fx(+a), t = fx(+b);
          const mx = (h.x + t.x) / 2, my = (h.y + t.y) / 2;
          const nx = -(t.y - h.y) * 0.35, ny = (t.x - h.x) * 0.35;
          const d = `M${h.x} ${h.y} Q${mx + nx} ${my + ny} ${mx} ${my} T${t.x} ${t.y}`;
          const c = SNAKE_COLORS[k % SNAKE_COLORS.length];
          return (
            <g key={'s' + a} className="snake">
              <path d={d} stroke="rgb(0 0 0 / 0.25)" strokeWidth="0.26" fill="none" strokeLinecap="round" transform="translate(0.03 0.04)" />
              <path d={d} stroke={c} strokeWidth="0.22" fill="none" strokeLinecap="round" />
              <path d={d} stroke="rgb(255 255 255 / 0.55)" strokeWidth="0.05" strokeDasharray="0.08 0.12" fill="none" strokeLinecap="round" />
              <circle cx={h.x} cy={h.y} r="0.2" fill={c} />
              <circle cx={h.x - 0.07} cy={h.y - 0.05} r="0.05" fill="#fff" /><circle cx={h.x + 0.07} cy={h.y - 0.05} r="0.05" fill="#fff" />
              <circle cx={h.x - 0.07} cy={h.y - 0.05} r="0.025" fill="#222" /><circle cx={h.x + 0.07} cy={h.y - 0.05} r="0.025" fill="#222" />
              <path d={`M${h.x} ${h.y + 0.14} l0 0.12 m0 0 l-0.05 0.06 m0.05 -0.06 l0.05 0.06`} stroke="#ff4b4b" strokeWidth="0.025" fill="none" />
            </g>
          );
        })}
      </svg>
      {players.map((p, i) => {
        const { x, y } = cellXY(p.pos || 1);
        const off = [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]][i];
        return (
          <motion.div key={i} className={'pawn' + (i === turn ? ' is-turn' : '') + (p.pos ? '' : ' is-start')} style={{ '--pc': p.color }}
            animate={{ left: `${((x + off[0]) / SIZE) * 100}%`, top: `${((y + off[1]) / SIZE) * 100}%` }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}>
            {p.bot ? <Mascot size={30} /> : <AnimalAvatar avatar={p.avatar} size={30} />}
          </motion.div>
        );
      })}
    </div>
  );
}
