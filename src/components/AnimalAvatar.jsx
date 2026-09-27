// Avatar pengguna: haiwan comel (gaya Belang) + hiasan dari kedai.
// avatar = { animal, color, hat, glasses, outfit, shoes, hand, background, frame }
// full = avatar badan penuh (kaki, kasut & barang dipegang kelihatan).
import { useId } from 'react';
import { DEFAULT_AVATAR, FUR, itemById } from '../lib/shop.js';

export default function AnimalAvatar({ avatar, size = 96, mood = 'happy', full = false, className = '', title }) {
  const a = { ...DEFAULT_AVATAR, ...avatar };
  const uid = useId().replace(/:/g, '');
  const [fur, dark, light] = FUR[a.color] || FUR.oren;
  const S = { fur, dark, light };
  const hat = itemById(a.hat);
  const hideEars = hat?.kind === 'tudung' || hat?.kind === 'topi-keledar';
  const H = full ? 190 : 120;
  const width = size;
  const height = full ? Math.round(size * (H / 120)) : size;

  return (
    <svg className={'animal-avatar' + (full ? ' is-full' : '') + ' ' + className} viewBox={`0 0 120 ${H}`}
      width={width} height={height} style={{ width, height }} role="img" aria-label={title || 'Avatar'}>
      <defs>
        {full ? <clipPath id={`clip-${uid}`}><rect x="2" y="2" width="116" height={H - 4} rx="22" /></clipPath>
          : <clipPath id={`clip-${uid}`}><circle cx="60" cy="60" r="58" /></clipPath>}
        <linearGradient id={`rainbow-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4b4b" /><stop offset="0.25" stopColor="#ffc800" />
          <stop offset="0.5" stopColor="#58cc02" /><stop offset="0.75" stopColor="#1cb0f6" /><stop offset="1" stopColor="#ce82ff" />
        </linearGradient>
        <linearGradient id={`fire-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff4b4b" /><stop offset="0.6" stopColor="#ff9600" /><stop offset="1" stopColor="#ffc800" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        <Background item={itemById(a.background)} H={H} />
        <g transform={full ? 'translate(0 18)' : 'translate(0 6)'}>
          {itemById(a.outfit)?.kind === 'jaket-wira' && <path d="M30 88 Q60 70 90 88 L102 126 L18 126 Z" fill="#ff4b4b" />}
          {itemById(a.outfit)?.kind === 'jubah-diraja' && <path d="M28 88 Q60 68 92 88 L106 130 L14 130 Z" fill="#7b2cbf" />}
          {full && <Legs S={S} kind={a.animal} />}
          {full && <Shoes item={itemById(a.shoes)} />}
          <Animal kind={a.animal} S={S} hideEars={hideEars} mood={mood} />
          <Outfit item={itemById(a.outfit)} full={full} />
          <Glasses item={itemById(a.glasses)} />
          <Hat item={hat} />
          {full && <Hand item={itemById(a.hand)} uid={uid} />}
        </g>
      </g>
      <Frame item={itemById(a.frame)} uid={uid} full={full} H={H} />
    </svg>
  );
}

// ---------------- latar ----------------
function Background({ item, H }) {
  const k = item?.kind || 'latar-langit';
  const ground = H - 30;
  switch (k) {
    case 'latar-taman':
      return (
        <g>
          <rect width="120" height={H} fill="#c9f0ff" />
          <ellipse cx="60" cy={H} rx="95" ry="46" fill="#8ee06a" />
          {[[14, H - 24, '#ff7eb6'], [106, H - 26, '#ffc800'], [26, H - 12, '#fff'], [96, H - 12, '#ff7eb6']].map(([x, y, c], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill={c} />
          ))}
        </g>
      );
    case 'latar-pantai':
      return (
        <g>
          <rect width="120" height={H} fill="#bdeaff" />
          <circle cx="98" cy="22" r="10" fill="#ffd84d" />
          <rect y={ground - 22} width="120" height="22" fill="#34b6e8" />
          <path d={`M0 ${ground - 22} q15 -5 30 0 t30 0 t30 0 t30 0`} fill="none" stroke="#fff" strokeWidth="2" />
          <rect y={ground} width="120" height="40" fill="#ffe0a3" />
        </g>
      );
    case 'latar-gunung':
      return (
        <g>
          <rect width="120" height={H} fill="#dff3ff" />
          <path d={`M-10 ${ground} L30 ${ground - 60} L60 ${ground} Z`} fill="#8aa6b8" />
          <path d={`M40 ${ground} L80 ${ground - 75} L130 ${ground} Z`} fill="#6f8ea3" />
          <path d={`M72 ${ground - 60} L80 ${ground - 75} L88 ${ground - 60} Z`} fill="#fff" />
          <rect y={ground} width="120" height="40" fill="#7fcf5a" />
        </g>
      );
    case 'latar-masjid':
      return (
        <g>
          <rect width="120" height={H} fill="#ffd9a8" />
          <rect y={ground - 40} width="120" height="80" fill="#ffb86b" />
          <path d={`M18 ${ground} V${ground - 22} Q30 ${ground - 38} 42 ${ground - 22} V${ground} Z M78 ${ground} V${ground - 22} Q90 ${ground - 38} 102 ${ground - 22} V${ground} Z`} fill="#e89a4b" />
          <path d={`M44 ${ground} V${ground - 30} Q60 ${ground - 56} 76 ${ground - 30} V${ground} Z`} fill="#e89a4b" />
          <rect x="8" y={ground - 46} width="6" height="46" fill="#e89a4b" /><rect x="106" y={ground - 46} width="6" height="46" fill="#e89a4b" />
        </g>
      );
    case 'latar-malam':
      return (
        <g>
          <rect width="120" height={H} fill="#1e2a55" />
          <circle cx="95" cy="22" r="10" fill="#fff4c2" /><circle cx="99" cy="19" r="9" fill="#1e2a55" />
          {[[15, 20], [35, 12], [60, 18], [22, 45], [100, 50], [80, 35], [10, 70], [108, 90], [18, 120]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" />
          ))}
        </g>
      );
    case 'latar-laut':
      return (
        <g>
          <rect width="120" height={H} fill="#1a7bb8" />
          <rect width="120" height={H / 2} fill="#2596d6" />
          {[[16, 30], [100, 60], [24, 90], [96, 120]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="none" stroke="#bfe8ff" strokeWidth="1.5" />
          ))}
          <path d={`M8 ${H} q6 -30 0 -50 M16 ${H} q-6 -26 4 -40 M104 ${H} q8 -34 -2 -56`} stroke="#2ecc71" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect y={H - 14} width="120" height="14" fill="#e6c98b" />
        </g>
      );
    case 'latar-pelangi':
      return (
        <g>
          <rect width="120" height={H} fill="#eaf8ff" />
          {['#ff4b4b', '#ff9600', '#ffc800', '#58cc02', '#1cb0f6', '#ce82ff'].map((c, i) => (
            <path key={c} d={`M${-10 + i * 8} ${H} A${70 - i * 8} ${70 - i * 8} 0 0 1 ${130 - i * 8} ${H}`}
              fill="none" stroke={c} strokeWidth="8" />
          ))}
        </g>
      );
    case 'latar-angkasa':
      return (
        <g>
          <rect width="120" height={H} fill="#12102e" />
          <circle cx="92" cy="30" r="14" fill="#ff9e5e" /><ellipse cx="92" cy="30" rx="22" ry="5" fill="none" stroke="#ffd29e" strokeWidth="2" />
          <circle cx="20" cy="100" r="7" fill="#7fd1ff" />
          {[[12, 16], [40, 26], [64, 10], [30, 60], [104, 80], [70, 70], [10, 140], [110, 150]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.5" fill="#fff" />
          ))}
        </g>
      );
    case 'latar-istana':
      return (
        <g>
          <rect width="120" height={H} fill="#fff1c7" />
          <rect x="18" y={ground - 50} width="84" height="50" fill="#ffc800" />
          <rect x="10" y={ground - 66} width="18" height="66" fill="#f0b400" /><rect x="92" y={ground - 66} width="18" height="66" fill="#f0b400" />
          <path d={`M8 ${ground - 66} L19 ${ground - 82} L30 ${ground - 66} Z M90 ${ground - 66} L101 ${ground - 82} L112 ${ground - 66} Z`} fill="#ff4b4b" />
          <rect x="52" y={ground - 26} width="16" height="26" rx="8" fill="#a86b00" />
          <rect y={ground} width="120" height="40" fill="#8ee06a" />
        </g>
      );
    default:
      return (
        <g>
          <rect width="120" height={H} fill="#ddf4ff" />
          <ellipse cx="22" cy="28" rx="14" ry="6" fill="#fff" /><ellipse cx="96" cy="40" rx="12" ry="5" fill="#fff" />
          {H > 120 && <rect y={H - 30} width="120" height="30" fill="#bde8a4" />}
        </g>
      );
  }
}

function Frame({ item, uid, full, H }) {
  if (!item) return null;
  const k = item.id;
  const stroke = k === 'bingkai-emas' ? '#ffc800' : k === 'bingkai-perak' ? '#c9d1d9' : k === 'bingkai-api' ? `url(#fire-${uid})`
    : k === 'bingkai-bunga' ? '#ff7eb6' : k === 'bingkai-bintang' ? '#1cb0f6' : `url(#rainbow-${uid})`;
  const shape = full
    ? <rect x="4" y="4" width="112" height={H - 8} rx="20" fill="none" stroke={stroke} strokeWidth="6" />
    : <circle cx="60" cy="60" r="56" fill="none" stroke={stroke} strokeWidth="6" />;
  const deco = (k === 'bingkai-bunga' || k === 'bingkai-bintang') && (full
    ? [[10, 10], [110, 10], [10, H - 10], [110, H - 10]]
    : [[14, 22], [106, 22], [14, 98], [106, 98]]);
  return (
    <g>
      {shape}
      {deco && deco.map(([x, y], i) => k === 'bingkai-bunga'
        ? <g key={i}><circle cx={x} cy={y} r="5" fill="#ff7eb6" /><circle cx={x} cy={y} r="2" fill="#ffc800" /></g>
        : <path key={i} d={`M${x} ${y - 6} l2 4 l5 1 l-4 3 l1 5 l-4 -2 l-4 2 l1 -5 l-4 -3 l5 -1 z`} fill="#ffc800" />)}
    </g>
  );
}

// ---------------- badan ----------------
function Eyes({ mood, y = 53, big = false }) {
  if (mood === 'cheer') {
    return (
      <g stroke="#2b2b2b" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d={`M40 ${y + 1} Q46 ${y - 7} 52 ${y + 1}`} /><path d={`M68 ${y + 1} Q74 ${y - 7} 80 ${y + 1}`} />
      </g>
    );
  }
  const rx = big ? 7 : 5.5, ry = big ? 8 : 7;
  return (
    <g>
      <ellipse cx="46" cy={y} rx={rx} ry={ry} fill="#2b2b2b" /><ellipse cx="74" cy={y} rx={rx} ry={ry} fill="#2b2b2b" />
      <circle cx="48" cy={y - 3} r="2" fill="#fff" /><circle cx="76" cy={y - 3} r="2" fill="#fff" />
    </g>
  );
}

function Legs({ S, kind }) {
  const fill = kind === 'panda' ? '#1f1f24' : S.fur;
  return (
    <g>
      <rect x="42" y="108" width="15" height="36" rx="7" fill={fill} stroke={S.dark} strokeWidth="2" />
      <rect x="63" y="108" width="15" height="36" rx="7" fill={fill} stroke={S.dark} strokeWidth="2" />
      <ellipse cx="49" cy="146" rx="10" ry="6" fill={fill} stroke={S.dark} strokeWidth="2" />
      <ellipse cx="71" cy="146" rx="10" ry="6" fill={fill} stroke={S.dark} strokeWidth="2" />
    </g>
  );
}

function Animal({ kind, S, hideEars, mood }) {
  const line = { stroke: S.dark, strokeWidth: 2 };
  const body = (
    <>
      <ellipse cx="60" cy="100" rx="27" ry="19" fill={S.fur} {...line} />
      <ellipse cx="60" cy="104" rx="15" ry="12" fill={S.light} />
      <ellipse cx="34" cy="98" rx="7" ry="11" transform="rotate(25 34 98)" fill={S.fur} {...line} />
      <ellipse cx="86" cy="98" rx="7" ry="11" transform="rotate(-25 86 98)" fill={S.fur} {...line} />
    </>
  );
  const head = <ellipse cx="60" cy="55" rx="37" ry="34" fill={S.fur} {...line} />;
  const cheeks = <g fill="#ff7e8a" opacity="0.5"><circle cx="34" cy="67" r="5" /><circle cx="86" cy="67" r="5" /></g>;
  const smile = mood === 'cheer'
    ? <path d="M53 72 Q60 70 67 72 Q66 81 60 81 Q54 81 53 72 Z" fill="#8a2c3a" />
    : <path d="M60 69 L60 72 M60 72 Q56 76 53 73 M60 72 Q64 76 67 73" stroke="#3a2a1a" strokeWidth="2.2" strokeLinecap="round" fill="none" />;
  const roundEars = !hideEars && (
    <>
      <circle cx="27" cy="30" r="12" fill={S.fur} {...line} /><circle cx="93" cy="30" r="12" fill={S.fur} {...line} />
      <circle cx="27" cy="31" r="6.5" fill="#ffb6a3" /><circle cx="93" cy="31" r="6.5" fill="#ffb6a3" />
    </>
  );
  const muzzleNose = (
    <>
      <ellipse cx="51" cy="70" rx="11" ry="9" fill={S.light} /><ellipse cx="69" cy="70" rx="11" ry="9" fill={S.light} />
      <path d="M55 64 Q60 61 65 64 Q63 69 60 69 Q57 69 55 64 Z" fill="#3a2a1a" />
    </>
  );

  switch (kind) {
    case 'kucing':
      return (
        <g>
          {body}
          {!hideEars && (
            <>
              <path d="M24 38 L30 10 L50 26 Z" fill={S.fur} {...line} /><path d="M96 38 L90 10 L70 26 Z" fill={S.fur} {...line} />
              <path d="M30 32 L33 17 L44 26 Z" fill="#ffb6a3" /><path d="M90 32 L87 17 L76 26 Z" fill="#ffb6a3" />
            </>
          )}
          {head}
          <ellipse cx="60" cy="70" rx="15" ry="10" fill={S.light} />
          {cheeks}<Eyes mood={mood} />
          <path d="M56 64 Q60 61 64 64 L60 68 Z" fill="#ff8aa0" />
          {smile}
          <path d="M42 68 l-14 -3 M42 72 l-14 2 M78 68 l14 -3 M78 72 l14 2" stroke={S.dark} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    case 'anjing':
      return (
        <g>
          {body}
          {head}
          {!hideEars && (
            <>
              <ellipse cx="25" cy="50" rx="10" ry="22" transform="rotate(15 25 50)" fill={S.dark} />
              <ellipse cx="95" cy="50" rx="10" ry="22" transform="rotate(-15 95 50)" fill={S.dark} />
            </>
          )}
          <ellipse cx="60" cy="71" rx="17" ry="12" fill={S.light} />
          {cheeks}<Eyes mood={mood} />
          <ellipse cx="60" cy="65" rx="6" ry="4.5" fill="#2b2b2b" />
          {smile}
          {mood !== 'cheer' && <path d="M57 76 Q60 84 63 76 Z" fill="#ff6b81" />}
        </g>
      );
    case 'beruang':
      return (
        <g>
          {body}
          {roundEars}
          {head}
          {muzzleNose}
          {cheeks}<Eyes mood={mood} />
          {smile}
        </g>
      );
    case 'singa':
      return (
        <g>
          {body}
          <g fill="#c96b00">
            {Array.from({ length: 14 }, (_, i) => {
              const ang = (i / 14) * Math.PI * 2;
              return <circle key={i} cx={60 + Math.cos(ang) * 40} cy={55 + Math.sin(ang) * 37} r="12" />;
            })}
          </g>
          {!hideEars && <><circle cx="30" cy="28" r="9" fill={S.fur} {...line} /><circle cx="90" cy="28" r="9" fill={S.fur} {...line} /></>}
          {head}
          {muzzleNose}
          {cheeks}<Eyes mood={mood} />
          {smile}
        </g>
      );
    case 'arnab':
      return (
        <g>
          {body}
          {!hideEars && (
            <>
              <ellipse cx="44" cy="12" rx="9" ry="26" fill={S.fur} {...line} /><ellipse cx="76" cy="12" rx="9" ry="26" fill={S.fur} {...line} />
              <ellipse cx="44" cy="14" rx="4.5" ry="18" fill="#ffb6c7" /><ellipse cx="76" cy="14" rx="4.5" ry="18" fill="#ffb6c7" />
            </>
          )}
          {head}
          <ellipse cx="60" cy="70" rx="14" ry="10" fill={S.light} />
          {cheeks}<Eyes mood={mood} />
          <path d="M56 64 Q60 61 64 64 L60 68 Z" fill="#ff8aa0" />
          {smile}
          <rect x="56.5" y="74" width="7" height="6" rx="1.5" fill="#fff" stroke="#cfcfcf" />
        </g>
      );
    case 'panda':
      return (
        <g>
          <ellipse cx="60" cy="100" rx="27" ry="19" fill="#f7f7f7" stroke="#cfcfcf" strokeWidth="2" />
          <ellipse cx="34" cy="98" rx="7" ry="11" transform="rotate(25 34 98)" fill="#1f1f24" />
          <ellipse cx="86" cy="98" rx="7" ry="11" transform="rotate(-25 86 98)" fill="#1f1f24" />
          {!hideEars && <><circle cx="28" cy="28" r="12" fill="#1f1f24" /><circle cx="92" cy="28" r="12" fill="#1f1f24" /></>}
          <ellipse cx="60" cy="55" rx="37" ry="34" fill="#f7f7f7" stroke="#cfcfcf" strokeWidth="2" />
          <ellipse cx="45" cy="54" rx="10" ry="13" transform="rotate(20 45 54)" fill="#1f1f24" />
          <ellipse cx="75" cy="54" rx="10" ry="13" transform="rotate(-20 75 54)" fill="#1f1f24" />
          <circle cx="46" cy="52" r="4" fill="#fff" /><circle cx="74" cy="52" r="4" fill="#fff" />
          <circle cx="47" cy="52" r="2.2" fill="#2b2b2b" /><circle cx="73" cy="52" r="2.2" fill="#2b2b2b" />
          {cheeks}
          <ellipse cx="60" cy="66" rx="5" ry="3.5" fill="#1f1f24" />
          {smile}
        </g>
      );
    case 'burung-hantu':
      return (
        <g>
          <ellipse cx="60" cy="100" rx="27" ry="19" fill={S.fur} {...line} />
          <path d="M48 96 q4 4 8 0 q4 4 8 0 M50 104 q5 4 10 0 q5 4 10 0" stroke={S.light} strokeWidth="2.5" fill="none" />
          <ellipse cx="32" cy="96" rx="9" ry="16" transform="rotate(15 32 96)" fill={S.dark} />
          <ellipse cx="88" cy="96" rx="9" ry="16" transform="rotate(-15 88 96)" fill={S.dark} />
          {!hideEars && <><path d="M28 30 L26 12 L42 24 Z" fill={S.dark} /><path d="M92 30 L94 12 L78 24 Z" fill={S.dark} /></>}
          {head}
          <circle cx="45" cy="53" r="14" fill="#fff" stroke={S.dark} strokeWidth="2" />
          <circle cx="75" cy="53" r="14" fill="#fff" stroke={S.dark} strokeWidth="2" />
          <Eyes mood={mood} big />
          <path d="M54 64 L66 64 L60 74 Z" fill="#ff9600" />
          {cheeks}
        </g>
      );
    case 'rubah':
      return (
        <g>
          <path d="M84 104 Q112 100 106 76 Q102 90 88 92 Z" fill={S.fur} {...line} />
          <path d="M104 80 Q106 76 106 76 Q108 86 100 92 Z" fill="#fff" />
          {body}
          {!hideEars && (
            <>
              <path d="M22 40 L24 6 L50 26 Z" fill={S.fur} {...line} /><path d="M98 40 L96 6 L70 26 Z" fill={S.fur} {...line} />
              <path d="M24 14 L24 6 L32 12 Z M96 14 L96 6 L88 12 Z" fill="#2b2b2b" />
            </>
          )}
          {head}
          <path d="M24 58 Q40 84 60 80 Q80 84 96 58 Q84 70 60 70 Q36 70 24 58 Z" fill={S.light} />
          {cheeks}<Eyes mood={mood} />
          <ellipse cx="60" cy="67" rx="5" ry="3.5" fill="#2b2b2b" />
          {smile}
        </g>
      );
    default: // harimau
      return (
        <g>
          <path d="M84 104 Q104 104 104 88 Q104 78 96 76" stroke={S.fur} strokeWidth="7" strokeLinecap="round" fill="none" />
          {body}
          <path d="M35 96 l8 2 M34 104 l8 0 M85 96 l-8 2 M86 104 l-8 0" stroke="#3a2a1a" strokeWidth="3" strokeLinecap="round" />
          {roundEars}
          {head}
          <path d="M24 50 l10 3 M23 59 l10 0 M96 50 l-10 3 M97 59 l-10 0 M52 30 l2 7 M60 29 l0 8 M68 30 l-2 7"
            stroke="#3a2a1a" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="51" cy="70" rx="11" ry="9" fill={S.light} /><ellipse cx="69" cy="70" rx="11" ry="9" fill={S.light} />
          {cheeks}<Eyes mood={mood} />
          <path d="M55 64 Q60 61 65 64 Q63 69 60 69 Q57 69 55 64 Z" fill="#e5566a" />
          {smile}
        </g>
      );
  }
}

// ---------------- hiasan ----------------
function Hat({ item }) {
  if (!item) return null;
  const c = item.color;
  switch (item.kind) {
    case 'songkok':
      return (
        <g>
          <path d="M38 30 Q37 15 42 11 Q60 4 78 11 Q83 15 82 30 Q60 25 38 30 Z" fill={c || '#1f1f24'} />
          <path d="M45 13 Q60 8 73 12" stroke={c ? '#fff3b0' : '#56565f'} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'kopiah':
      return (
        <g>
          <path d="M36 30 Q36 10 60 8 Q84 10 84 30 Q60 24 36 30 Z" fill="#ffffff" stroke="#d6d6d6" strokeWidth="2" />
          <path d="M42 22 Q60 16 78 22" stroke="#9ad0ff" strokeWidth="2" fill="none" strokeDasharray="3 3" />
        </g>
      );
    case 'tudung':
      return (
        <path d="M60 14 Q24 14 22 56 Q20 84 34 92 Q30 76 32 58 Q36 30 60 28 Q84 30 88 58 Q90 76 86 92 Q100 84 98 56 Q96 14 60 14 Z"
          fill={c || '#ce82ff'} stroke="rgb(0 0 0 / 0.18)" strokeWidth="2" />
      );
    case 'cap':
      return (
        <g>
          <path d="M34 30 Q34 8 60 8 Q86 8 86 30 Q60 24 34 30 Z" fill={c} />
          <path d="M60 26 Q88 22 104 30 Q86 34 60 30 Z" fill={c} stroke="rgb(0 0 0 / 0.2)" strokeWidth="1.5" />
          <circle cx="60" cy="9" r="3" fill="#fff" />
        </g>
      );
    case 'topi-graduasi':
      return (
        <g>
          <path d="M40 28 Q60 36 80 28 L80 20 Q60 26 40 20 Z" fill="#2b2b2b" />
          <path d="M24 16 L60 4 L96 16 L60 28 Z" fill="#3b3b44" />
          <path d="M60 16 L88 22 L88 36" stroke="#ffc800" strokeWidth="2.5" fill="none" />
          <circle cx="88" cy="38" r="3" fill="#ffc800" />
        </g>
      );
    case 'topi-chef':
      return (
        <g>
          <rect x="40" y="18" width="40" height="12" rx="3" fill="#fff" stroke="#d6d6d6" strokeWidth="2" />
          <circle cx="46" cy="12" r="10" fill="#fff" stroke="#d6d6d6" strokeWidth="2" />
          <circle cx="60" cy="6" r="11" fill="#fff" stroke="#d6d6d6" strokeWidth="2" />
          <circle cx="74" cy="12" r="10" fill="#fff" stroke="#d6d6d6" strokeWidth="2" />
          <rect x="41" y="14" width="38" height="12" fill="#fff" />
        </g>
      );
    case 'fon-kepala':
      return (
        <g>
          <path d="M22 50 Q22 12 60 12 Q98 12 98 50" stroke="#2b2b2b" strokeWidth="6" fill="none" />
          <rect x="14" y="44" width="14" height="22" rx="6" fill="#ff4b4b" />
          <rect x="92" y="44" width="14" height="22" rx="6" fill="#ff4b4b" />
        </g>
      );
    case 'mahkota':
      return (
        <g>
          <path d="M36 28 L36 8 L46 18 L60 4 L74 18 L84 8 L84 28 Z" fill={c || '#ffc800'} stroke="rgb(0 0 0 / 0.18)" strokeWidth="2" />
          <circle cx="60" cy="16" r="3" fill="#ff4b4b" /><circle cx="46" cy="21" r="2.5" fill="#1cb0f6" /><circle cx="74" cy="21" r="2.5" fill="#58cc02" />
        </g>
      );
    case 'topi-keledar':
      return (
        <g>
          <circle cx="60" cy="56" r="46" fill="#bfe6ff" fillOpacity="0.35" stroke="#e5e5e5" strokeWidth="5" />
          <path d="M28 34 Q40 22 52 20" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8" />
        </g>
      );
    default:
      return null;
  }
}

function Glasses({ item }) {
  if (!item) return null;
  switch (item.kind) {
    case 'cermin-bulat':
      return (
        <g fill="none" stroke={item.color || '#2b2b2b'} strokeWidth="2.5">
          <circle cx="46" cy="53" r="10" /><circle cx="74" cy="53" r="10" /><path d="M56 53 Q60 50 64 53" />
        </g>
      );
    case 'cermin-hitam':
      return (
        <g>
          <path d="M34 47 H57 Q57 62 46 62 Q34 62 34 47 Z M63 47 H86 Q86 62 74 62 Q63 62 63 47 Z" fill="#1f1f24" />
          <path d="M57 50 H63" stroke="#1f1f24" strokeWidth="3" />
          <path d="M38 50 L44 50" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </g>
      );
    case 'cermin-bintang':
      return (
        <g fill="#ff7eb6" stroke="#e05596" strokeWidth="1.5">
          <path d="M46 42 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" />
          <path d="M74 42 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" />
        </g>
      );
    case 'cermin-hati':
      return (
        <g fill="#ff4b4b" stroke="#c81e3a" strokeWidth="1.5">
          <path d="M46 62 L36 52 Q33 44 40 43 Q44 43 46 47 Q48 43 52 43 Q59 44 56 52 Z" />
          <path d="M74 62 L64 52 Q61 44 68 43 Q72 43 74 47 Q76 43 80 43 Q87 44 84 52 Z" />
        </g>
      );
    case 'topeng-wira':
      return (
        <g>
          <path d="M28 46 Q60 38 92 46 Q92 62 76 62 Q66 62 60 56 Q54 62 44 62 Q28 62 28 46 Z" fill="#1f1f24" />
          <ellipse cx="46" cy="52" rx="6" ry="4" fill="#fff" /><ellipse cx="74" cy="52" rx="6" ry="4" fill="#fff" />
          <path d="M92 48 L104 42 M92 52 L106 54" stroke="#1f1f24" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

function Outfit({ item, full }) {
  if (!item) return null;
  const c = item.color;
  const bottom = full ? 126 : 120;
  switch (item.kind) {
    case 'baju-melayu':
      return (
        <g>
          <path d={`M34 92 Q60 82 86 92 Q88 112 60 ${bottom} Q32 112 34 92 Z`} fill={c} />
          <path d="M60 86 V110" stroke="rgb(0 0 0 / 0.18)" strokeWidth="2" />
          <circle cx="60" cy="94" r="1.8" fill="#ffc800" /><circle cx="60" cy="101" r="1.8" fill="#ffc800" />
          <path d="M48 86 Q60 92 72 86" stroke="rgb(0 0 0 / 0.18)" strokeWidth="3" fill="none" />
          {full && <path d="M36 110 Q60 122 84 110 L84 118 Q60 128 36 118 Z" fill="#ffc800" opacity="0.9" />}
        </g>
      );
    case 'jersi':
      return (
        <g>
          <path d={`M34 92 Q60 82 86 92 Q88 112 60 ${bottom} Q32 112 34 92 Z`} fill={c} />
          <path d="M36 98 H84" stroke="#fff" strokeWidth="4" />
          <text x="60" y="114" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="Nunito, sans-serif">1</text>
        </g>
      );
    case 'hoodie':
      return (
        <g>
          <path d={`M32 92 Q60 80 88 92 Q90 114 60 ${bottom} Q30 114 32 92 Z`} fill={c} />
          <path d="M44 86 Q60 100 76 86" stroke="rgb(0 0 0 / 0.2)" strokeWidth="3" fill="none" />
          <path d="M56 94 V104 M64 94 V104" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <rect x="48" y="104" width="24" height="9" rx="3" fill="rgb(0 0 0 / 0.12)" />
        </g>
      );
    case 'jubah':
      return (
        <g>
          <path d={`M34 90 Q60 80 86 90 Q92 114 60 ${bottom + 4} Q28 114 34 90 Z`} fill="#ffffff" stroke="#e0e0e0" strokeWidth="2" />
          <path d="M60 86 V118" stroke="#e0e0e0" strokeWidth="2" />
        </g>
      );
    case 'baju-angkasawan':
      return (
        <g>
          <path d={`M32 92 Q60 82 88 92 Q90 114 60 ${bottom} Q30 114 32 92 Z`} fill="#f2f5f8" stroke="#b9c3cc" strokeWidth="2" />
          <rect x="50" y="96" width="20" height="12" rx="3" fill="#1cb0f6" />
          <circle cx="55" cy="102" r="2" fill="#ff4b4b" /><circle cx="61" cy="102" r="2" fill="#ffc800" /><circle cx="67" cy="102" r="2" fill="#58cc02" />
        </g>
      );
    case 'jaket-wira':
      return (
        <g>
          <path d="M40 92 Q60 84 80 92 Q82 110 60 116 Q38 110 40 92 Z" fill="#1cb0f6" />
          <path d="M60 96 l4 6 l-4 6 l-4 -6 z" fill="#ffc800" />
        </g>
      );
    case 'jubah-diraja':
      return (
        <g>
          <path d={`M36 92 Q60 82 84 92 Q86 112 60 ${bottom} Q34 112 36 92 Z`} fill="#9b4dca" />
          <path d="M36 92 Q60 82 84 92" stroke="#ffc800" strokeWidth="4" fill="none" />
          <path d="M60 88 V116" stroke="#ffc800" strokeWidth="3" />
          <circle cx="60" cy="98" r="3" fill="#ff4b4b" />
        </g>
      );
    default:
      return null;
  }
}

function Shoes({ item }) {
  if (!item) return null;
  const c = item.color;
  switch (item.kind) {
    case 'selipar':
      return (
        <g>
          <rect x="37" y="146" width="24" height="6" rx="3" fill="#1cb0f6" /><rect x="59" y="146" width="24" height="6" rx="3" fill="#1cb0f6" />
          <path d="M46 146 L49 140 L52 146 M68 146 L71 140 L74 146" stroke="#1cb0f6" strokeWidth="2" fill="none" />
        </g>
      );
    case 'but':
      return (
        <g>
          <path d="M40 132 H58 V150 H36 Q36 144 40 142 Z" fill={c} stroke="rgb(0 0 0 / 0.25)" strokeWidth="2" />
          <path d="M62 132 H80 V150 H58 Q58 144 62 142 Z" fill={c} stroke="rgb(0 0 0 / 0.25)" strokeWidth="2" />
        </g>
      );
    case 'kasut-roket':
      return (
        <g>
          <path d="M36 142 H60 Q62 150 58 152 H38 Q34 150 36 142 Z" fill="#dfe6ee" stroke="#9aa5b1" strokeWidth="2" />
          <path d="M60 142 H84 Q86 150 82 152 H62 Q58 150 60 142 Z" fill="#dfe6ee" stroke="#9aa5b1" strokeWidth="2" />
          <path d="M42 152 L46 162 L50 152 M66 152 L70 162 L74 152" fill="#ff9600" />
        </g>
      );
    default: // kasut
      return (
        <g>
          <path d="M36 142 H60 Q62 150 58 152 H38 Q34 150 36 142 Z" fill={c} stroke="rgb(0 0 0 / 0.25)" strokeWidth="2" />
          <path d="M60 142 H84 Q86 150 82 152 H62 Q58 150 60 142 Z" fill={c} stroke="rgb(0 0 0 / 0.25)" strokeWidth="2" />
          <path d="M40 147 H56 M64 147 H80" stroke="rgb(0 0 0 / 0.2)" strokeWidth="2" />
        </g>
      );
  }
}

// Barang dipegang di sebelah tangan kanan.
function Hand({ item, uid }) {
  if (!item) return null;
  switch (item.kind) {
    case 'buku':
      return <g transform="translate(86 92) rotate(-10)"><rect width="18" height="22" rx="2" fill="#58cc02" /><rect x="3" y="0" width="2" height="22" fill="#3d9400" /><rect x="7" y="6" width="8" height="2" fill="#fff" /></g>;
    case 'pensel':
      return <g transform="translate(88 78) rotate(20)"><rect width="6" height="30" fill="#ffc800" /><path d="M0 30 L3 38 L6 30 Z" fill="#f3d6a3" /><rect width="6" height="4" fill="#ff7eb6" /></g>;
    case 'belon':
      return <g><path d="M96 96 Q100 70 98 50" stroke="#555" strokeWidth="1.2" fill="none" /><ellipse cx="98" cy="38" rx="11" ry="13" fill="#ff4b4b" /><ellipse cx="94" cy="33" rx="3" ry="4" fill="#fff" opacity="0.6" /></g>;
    case 'tasbih':
      return <g>{Array.from({ length: 11 }, (_, i) => { const t = (i / 11) * Math.PI * 2; return <circle key={i} cx={96 + Math.cos(t) * 9} cy={104 + Math.sin(t) * 9} r="2.6" fill="#8b5a2b" />; })}<circle cx="96" cy="118" r="3" fill="#ffc800" /></g>;
    case 'bendera':
      return <g><rect x="94" y="56" width="3" height="52" fill="#7a4a25" /><rect x="97" y="58" width="22" height="14" fill="#58cc02" /><circle cx="105" cy="65" r="4" fill="#fff" /><circle cx="106.5" cy="64" r="3.5" fill="#58cc02" /></g>;
    case 'piala':
      return <g transform="translate(86 86)"><path d="M2 0 H22 V8 Q22 18 12 20 Q2 18 2 8 Z" fill="#ffc800" /><rect x="9" y="20" width="6" height="6" fill="#e0a800" /><rect x="4" y="26" width="16" height="4" rx="1" fill="#e0a800" /></g>;
    case 'tongkat-sakti':
      return <g><rect x="94" y="62" width="4" height="46" rx="2" fill="#6b3fa0" transform="rotate(15 96 85)" /><path d="M104 50 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" fill="#ffc800" /></g>;
    case 'obor':
      return <g><path d="M92 108 L98 70 L104 70 L100 108 Z" fill="#a86b3c" /><path d="M101 70 Q88 58 100 40 Q104 52 108 48 Q114 62 101 70 Z" fill={`url(#fire-${uid})`} /></g>;
    default:
      return null;
  }
}
