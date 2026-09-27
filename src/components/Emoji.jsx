// Emoji 3D (Fluent Emoji, dihos dalam public/emoji) supaya rupa sama di semua peranti.
// <Emoji e="🔥" />  atau  <EmojiText>{'Siap ✅'}</EmojiText> untuk teks bercampur emoji.
import map from '../lib/emoji-map.json';
import { assetUrl } from '../lib/quiz.js';

const EMOJI_RE = /((?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}])(?:\u{FE0F}|\u{200D}[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]\u{FE0F}?|[\u{1F3FB}-\u{1F3FF}])*)/u;

export default function Emoji({ e, size = '1.25em', className = '', label }) {
  const code = map[e] || map[e?.replace(/️/g, '')];
  if (!code) return <span className={className}>{e}</span>;
  return (
    <img className={'emoji ' + className} src={assetUrl(`emoji/${code}.webp`)} alt={label || ''}
      aria-hidden={label ? undefined : true} draggable={false} style={{ width: size, height: size }} />
  );
}

// Tukar setiap emoji dalam rentetan kepada <Emoji>.
export function EmojiText({ children, size }) {
  if (typeof children !== 'string') return children ?? null;
  const parts = children.split(new RegExp(EMOJI_RE.source, 'gu'));
  return parts.map((p, i) => (i % 2 ? <Emoji key={i} e={p} size={size} /> : p));
}
