// Belang — maskot laman: anak harimau comel bersongkok.
// mood: 'happy' | 'cheer' | 'sad' | 'think' | 'wave'
export default function Mascot({ mood = 'happy', size = 120, className = '' }) {
  const eyeY = mood === 'sad' ? 55 : mood === 'think' ? 49 : 53;
  const eyeDX = mood === 'think' ? -2 : 0;
  return (
    <svg className={`mascot mascot-${mood} ${className}`} width={size} height={size} viewBox="0 0 120 120"
      style={{ width: size, height: size }}
      role="img" aria-label="Belang, maskot harimau Kuiz Ulang Kaji">
      <ellipse className="m-shadow" cx="60" cy="115" rx="30" ry="4" />
      <g className="m-body">
        {/* ekor */}
        <path className="m-tail" d="M84 100 Q104 100 104 84 Q104 74 96 72" />
        <path className="m-tail-stripe" d="M101 90 l-6 -2 M103 81 l-6 1" />

        {/* badan */}
        <ellipse className="m-fill" cx="60" cy="96" rx="27" ry="19" />
        <ellipse className="m-belly" cx="60" cy="100" rx="15" ry="13" />
        <path className="m-stripe" d="M35 92 l8 2 M34 100 l8 0 M85 92 l-8 2 M86 100 l-8 0" />

        {/* kaki */}
        <ellipse className="m-fill" cx="47" cy="112" rx="8" ry="5" />
        <ellipse className="m-fill" cx="73" cy="112" rx="8" ry="5" />

        {/* tangan (m-arm-right melambai / bersorak) */}
        <g className="m-arm m-arm-left">
          <ellipse cx="34" cy="96" rx="7" ry="11" transform="rotate(25 34 96)" />
        </g>
        <g className="m-arm m-arm-right">
          <ellipse cx="86" cy="96" rx="7" ry="11" transform="rotate(-25 86 96)" />
        </g>

        {/* telinga */}
        <circle className="m-fill" cx="27" cy="30" r="12" />
        <circle className="m-fill" cx="93" cy="30" r="12" />
        <circle className="m-ear-in" cx="27" cy="31" r="6.5" />
        <circle className="m-ear-in" cx="93" cy="31" r="6.5" />

        {/* kepala */}
        <ellipse className="m-fill" cx="60" cy="55" rx="37" ry="34" />
        {/* belang di kepala & pipi */}
        <path className="m-stripe" d="M24 50 l10 3 M23 59 l10 0 M96 50 l-10 3 M97 59 l-10 0" />
        <path className="m-stripe" d="M52 30 l2 7 M60 29 l0 8 M68 30 l-2 7" />

        {/* songkok */}
        <path className="m-songkok" d="M38 30 Q37 15 42 11 Q60 4 78 11 Q83 15 82 30 Q60 25 38 30 Z" />
        <path className="m-songkok-shine" d="M45 13 Q60 8 73 12" />

        {/* muncung */}
        <ellipse className="m-muzzle" cx="51" cy="70" rx="11" ry="9" />
        <ellipse className="m-muzzle" cx="69" cy="70" rx="11" ry="9" />
        <ellipse className="m-muzzle" cx="60" cy="74" rx="9" ry="7" />
        <circle className="m-cheek" cx="34" cy="68" r="5" />
        <circle className="m-cheek" cx="86" cy="68" r="5" />
        <path className="m-whisker" d="M40 69 l-12 -2 M40 73 l-12 2 M80 69 l12 -2 M80 73 l12 2" />

        {/* mata */}
        <g className="m-eyes">
          {mood === 'cheer' ? (
            <>
              <path className="m-eye-arc" d="M40 54 Q46 46 52 54" />
              <path className="m-eye-arc" d="M68 54 Q74 46 80 54" />
            </>
          ) : (
            <>
              <ellipse className="m-eye" cx={46 + eyeDX} cy={eyeY} rx="5.5" ry="7" />
              <ellipse className="m-eye" cx={74 + eyeDX} cy={eyeY} rx="5.5" ry="7" />
              <circle className="m-glint" cx={48 + eyeDX} cy={eyeY - 3} r="2" />
              <circle className="m-glint" cx={76 + eyeDX} cy={eyeY - 3} r="2" />
            </>
          )}
          {mood === 'sad' && (
            <>
              <path className="m-brow" d="M38 42 L52 46" />
              <path className="m-brow" d="M82 42 L68 46" />
            </>
          )}
        </g>

        {/* hidung & mulut */}
        <path className="m-nose" d="M55 64 Q60 61 65 64 Q63 69 60 69 Q57 69 55 64 Z" />
        {mood === 'cheer' || mood === 'wave' ? (
          <path className="m-mouth-open" d="M53 72 Q60 70 67 72 Q66 82 60 82 Q54 82 53 72 Z" />
        ) : mood === 'sad' ? (
          <path className="m-mouth" d="M54 77 Q60 72 66 77" />
        ) : (
          <path className="m-mouth" d="M60 69 L60 72 M60 72 Q56 76 53 73 M60 72 Q64 76 67 73" />
        )}

        {mood === 'sad' && <path className="m-tear" d="M84 58 q3 6 0 9 q-3 -3 0 -9 z" />}
        {mood === 'think' && <text className="m-think" x="96" y="24">?</text>}
        {mood === 'cheer' && (
          <g className="m-sparkles">
            <path d="M10 34 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 l6 -3 z" />
            <path d="M106 16 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z" />
          </g>
        )}
      </g>
    </svg>
  );
}

// Belon kata-kata di sebelah maskot.
export function SpeechBubble({ children, className = '' }) {
  return <div className={'speech-bubble ' + className}>{children}</div>;
}
