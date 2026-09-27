// Dadu 3D (CSS): kiub berputar dan berhenti pada nilai `value`. `roll` bertambah setiap balingan.
const PIPS = {
  1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9],
};
// Putaran kiub supaya muka `n` menghadap ke depan.
const FACE_TURN = { 1: [0, 0], 2: [0, -90], 3: [0, -180], 4: [0, 90], 5: [-90, 0], 6: [90, 0] };

export default function Dice({ value = 1, roll = 0, size = 72 }) {
  const [x, y] = FACE_TURN[value] || FACE_TURN[1];
  // Tambah pusingan penuh setiap balingan supaya dadu nampak bergolek.
  const spin = roll * 720;
  return (
    <div className="dice-scene" style={{ '--dice': size + 'px' }} aria-label={`Dadu: ${value}`} role="img">
      <div className="dice-cube" style={{ transform: `rotateX(${x + spin}deg) rotateY(${y + spin}deg)` }}>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} className={`dice-face face-${n}`}>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={PIPS[n].includes(i + 1) ? 'pip' : 'pip is-empty'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
