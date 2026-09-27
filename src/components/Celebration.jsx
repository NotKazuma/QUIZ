// Bola-bola jatuh meraikan markah baik (React Bits Ballpit, three.js).
// Dimuat secara lazy supaya three.js hanya diambil bila skrin keputusan dibuka.
import { memo } from 'react';
import Ballpit from './bits/Ballpit.jsx';

function Celebration() {
  return (
    <Ballpit
      count={28}
      gravity={0.6}
      friction={0.996}
      wallBounce={0.9}
      followCursor={false}
      minSize={0.7}
      maxSize={1.3}
      colors={[0x14b8a6, 0xf59e0b, 0x22c55e, 0x2dd4bf]}
      ambientIntensity={1}
      lightIntensity={150}
    />
  );
}

export default memo(Celebration);
