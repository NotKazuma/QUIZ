// Avatar pengguna: haiwan comel (gaya Belang) + hiasan pilihan dari kedai.
// avatar = { animal, color, hat, glasses, outfit, background, frame }
import { useId } from 'react';
import { DEFAULT_AVATAR, FUR } from '../lib/shop.js';

export default function AnimalAvatar({ avatar, size = 96, mood = 'happy', className = '', title }) {
  const a = { ...DEFAULT_AVATAR, ...avatar };
  const uid = useId().replace(/:/g, '');
  const [fur, dark, light] = FUR[a.color] || FUR.oren;
  const S = { fur, dark, light };
  const hideEars = a.hat === 'tudung' || a.hat === 'topi-keledar';

  return (
    <svg className={'animal-avatar ' + className} viewBox="0 0 120 120" width={size} height={size}
      style={{ width: size, height: size }} role="img" aria-label={title || 'Avatar'}>
      <defs>
        <clipPath id={`clip-${uid}`}><circle cx="60" cy="60" r="58" /></clipPath>
        <linearGradient id={`rainbow-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4b4b" /><stop offset="0.25" stopColor="#ffc800" />
          <stop offset="0.5" stopColor="#58cc02" /><stop offset="0.75" stopColor="#1cb0f6" /><stop offset="1" stopColor="#ce82ff" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        <Background id={a.background} uid={uid} />
        <g transform="translate(0 6)">
          {a.outfit === 'jaket-wira' && <path d="M30 88 Q60 70 90 88 L102 126 L18 126 Z" fill="#ff4b4b" />}
          <Animal kind={a.animal} S={S} hideEars={hideEars} mood={mood} />
          <Outfit id={a.outfit} />
          <Glasses id={a.glasses} />
          <Hat id={a.hat} S={S} />
        </g>
      </g>
      <Frame id={a.frame} uid={uid} />
    </svg>
  );
}

function Background({ id, uid }) {
  switch (id) {
    case 'latar-masjid':
      return (
        <g>
          <rect width="120" height="120" fill="#ffd9a8" />
          <rect y="60" width="120" height="60" fill="#ffb86b" />
          <path d="M18 96 V74 Q30 58 42 74 V96 Z M78 96 V74 Q90 58 102 74 V96 Z" fill="#e89a4b" />
          <path d="M44 96 V66 Q60 40 76 66 V96 Z" fill="#e89a4b" />
          <rect x="8" y="50" width="6" height="46" fill="#e89a4b" /><rect x="106" y="50" width="6" height="46" fill="#e89a4b" />
        </g>
      );
    case 'latar-malam':
      return (
        <g>
          <rect width="120" height="120" fill="#1e2a55" />
          <circle cx="95" cy="22" r="10" fill="#fff4c2" /><circle cx="99" cy="19" r="9" fill="#1e2a55" />
          {[[15, 20], [35, 12], [60, 18], [22, 45], [100, 50], [80, 35], [10, 70]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" />
          ))}
        </g>
      );
    case 'latar-taman':
      return (
        <g>
          <rect width="120" height="120" fill="#c9f0ff" />
          <ellipse cx="60" cy="120" rx="90" ry="40" fill="#8ee06a" />
          {[[16, 96, '#ff7eb6'], [104, 94, '#ffc800'], [26, 108, '#ffffff'], [96, 108, '#ff7eb6']].map(([x, y, c], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill={c} />
          ))}
        </g>
      );
    case 'latar-pelangi':
      return (
        <g>
          <rect width="120" height="120" fill="#eaf8ff" />
          {['#ff4b4b', '#ff9600', '#ffc800', '#58cc02', '#1cb0f6', '#ce82ff'].map((c, i) => (
            <path key={c} d={`M${-10 + i * 8} 120 A${70 - i * 8} ${70 - i * 8} 0 0 1 ${130 - i * 8} 120`}
              fill="none" stroke={c} strokeWidth="8" />
          ))}
        </g>
      );
    default: // latar-langit
      return (
        <g>
          <rect width="120" height="120" fill="#ddf4ff" />
          <ellipse cx="22" cy="28" rx="14" ry="6" fill="#fff" /><ellipse cx="96" cy="40" rx="12" ry="5" fill="#fff" />
        </g>
      );
  }
}

function Frame({ id, uid }) {
  if (!id) return null;
  const stroke = id === 'bingkai-emas' ? '#ffc800' : id === 'bingkai-perak' ? '#c9d1d9' : `url(#rainbow-${uid})`;
  return <circle cx="60" cy="60" r="56" fill="none" stroke={stroke} strokeWidth="6" />;
}

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
  const cheeks = (
    <g fill="#ff7e8a" opacity="0.5"><circle cx="34" cy="67" r="5" /><circle cx="86" cy="67" r="5" /></g>
  );
  const smile = mood === 'cheer'
    ? <path d="M53 72 Q60 70 67 72 Q66 81 60 81 Q54 81 53 72 Z" fill="#8a2c3a" />
    : <path d="M60 69 L60 72 M60 72 Q56 76 53 73 M60 72 Q64 76 67 73" stroke="#3a2a1a" strokeWidth="2.2" strokeLinecap="round" fill="none" />;

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
          {!hideEars && (
            <>
              <circle cx="27" cy="30" r="12" fill={S.fur} {...line} /><circle cx="93" cy="30" r="12" fill={S.fur} {...line} />
              <circle cx="27" cy="31" r="6.5" fill="#ffb6a3" /><circle cx="93" cy="31" r="6.5" fill="#ffb6a3" />
            </>
          )}
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

function Hat({ id }) {
  switch (id) {
    case 'songkok':
      return (
        <g>
          <path d="M38 30 Q37 15 42 11 Q60 4 78 11 Q83 15 82 30 Q60 25 38 30 Z" fill="#1f1f24" />
          <path d="M45 13 Q60 8 73 12" stroke="#56565f" strokeWidth="2" fill="none" strokeLinecap="round" />
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
          fill="#ce82ff" stroke="#a568cc" strokeWidth="2" />
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
    case 'mahkota':
      return (
        <g>
          <path d="M36 28 L36 8 L46 18 L60 4 L74 18 L84 8 L84 28 Z" fill="#ffc800" stroke="#e0a800" strokeWidth="2" />
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

function Glasses({ id }) {
  switch (id) {
    case 'cermin-bulat':
      return (
        <g fill="none" stroke="#2b2b2b" strokeWidth="2.5">
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
    default:
      return null;
  }
}

function Outfit({ id }) {
  switch (id) {
    case 'baju-melayu':
      return (
        <g>
          <path d="M34 92 Q60 82 86 92 Q88 112 60 120 Q32 112 34 92 Z" fill="#1cb0f6" />
          <path d="M60 86 V110" stroke="#1899d6" strokeWidth="2" />
          <circle cx="60" cy="94" r="1.8" fill="#ffc800" /><circle cx="60" cy="101" r="1.8" fill="#ffc800" />
          <path d="M48 86 Q60 92 72 86" stroke="#1899d6" strokeWidth="3" fill="none" />
        </g>
      );
    case 'jersi':
      return (
        <g>
          <path d="M34 92 Q60 82 86 92 Q88 112 60 120 Q32 112 34 92 Z" fill="#58cc02" />
          <path d="M36 98 H84" stroke="#fff" strokeWidth="4" />
          <text x="60" y="114" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="Nunito, sans-serif">1</text>
        </g>
      );
    case 'jubah':
      return (
        <g>
          <path d="M34 90 Q60 80 86 90 Q92 114 60 124 Q28 114 34 90 Z" fill="#ffffff" stroke="#e0e0e0" strokeWidth="2" />
          <path d="M60 86 V118" stroke="#e0e0e0" strokeWidth="2" />
        </g>
      );
    case 'jaket-wira':
      return (
        <g>
          <path d="M40 92 Q60 84 80 92 Q82 110 60 116 Q38 110 40 92 Z" fill="#1cb0f6" />
          <path d="M60 96 l4 6 l-4 6 l-4 -6 z" fill="#ffc800" />
        </g>
      );
    default:
      return null;
  }
}
