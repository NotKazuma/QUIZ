// Komponen asas gaya shadcn: ikon, kad tindakan, lencana, bar kemajuan.
import AnimatedContent from './bits/AnimatedContent.jsx';
import GlareHover from './bits/GlareHover.jsx';
import SpotlightCard from './bits/SpotlightCard.jsx';
import StarBorder from './bits/StarBorder.jsx';

// Pengguna yang minta kurang animasi tidak akan nampak kesan masuk/latar bergerak.
export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ikon gaya Lucide (laluan SVG 24x24). Peperiksaan pilih ikon melalui medan `icon` dalam config.json.
const ICONS = {
  back: <path d="m15 18-6-6 6-6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  book: <><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>,
  pencil: <><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></>,
  clock: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M10 2h4" /></>,
  chart: <><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>,
  layers: <><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /><path d="m2 12 8.58 3.91a2 2 0 0 0 1.66 0L22 12" /><path d="m2 17 8.58 3.91a2 2 0 0 0 1.66 0L22 17" /></>,
  'book-check': <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /><path d="m9 9.5 2 2 4-4" /></>,
  user: <><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
  bolt: <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />,
  shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  plus: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  play: <polygon points="6 3 20 12 6 21 6 3" />,
  lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
  graduation: <><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>,
};

export function Icon({ name, className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {ICONS[name]}
    </svg>
  );
}

export function Badge({ children, variant = 'default' }) {
  if (!children) return null;
  const cls = variant === 'default' ? 'badge' : 'badge badge-' + variant;
  return <span className={cls}>{children}</span>;
}

export function Progress({ value, large }) {
  return (
    <div className={'progress' + (large ? ' progress-lg' : '')} role="progressbar"
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
      <div className="progress-bar" style={{ width: value + '%' }} />
    </div>
  );
}

export function BackButton({ onClick }) {
  return (
    <button className="btn btn-ghost btn-back" onClick={onClick}>
      <Icon name="back" /> Kembali
    </button>
  );
}

export function PageHead({ badge, title }) {
  return (
    <div className="page-head">
      <Badge>{badge}</Badge>
      <h2>{title}</h2>
    </div>
  );
}

// Kad boleh tekan dengan kesan cahaya ikut jari/tetikus (React Bits SpotlightCard).
// `icon` boleh jadi nama ikon atau teks pendek (cth. nombor subjek, tahun).
export function ActionCard({ icon, iconStyle, title, desc, onClick, disabled, soon, className = '' }) {
  const iconNode = ICONS[icon] ? <Icon name={icon} /> : icon;
  // Kilauan melintas bila disentuh (GlareHover) + cahaya ikut jari (SpotlightCard).
  return (
    <GlareHover className={'glare-wrap' + (disabled ? ' is-disabled' : '')} width="100%" height="auto"
      background="transparent" borderColor="transparent" borderRadius="calc(var(--radius) + 4px)"
      glareColor="#ffffff" glareOpacity={0.35} glareSize={300} transitionDuration={800}>
    <SpotlightCard
      className={'card action-card ' + (disabled ? 'is-disabled ' : '') + className}
      spotlightColor="rgba(20, 184, 166, 0.25)"
    >
      <button className="card-button" onClick={onClick} disabled={disabled}>
        <span className={'card-icon' + (disabled ? ' icon-muted' : '')} style={iconStyle} aria-hidden="true">{iconNode}</span>
        <span className="card-text">
          <span className="card-title">{title}</span>
          {desc && <span className="card-desc">{desc}</span>}
        </span>
        {soon ? <Badge variant="outline">Akan datang</Badge> : <Icon name="chevron" className="chevron" />}
      </button>
    </SpotlightCard>
    </GlareHover>
  );
}

// Kandungan muncul dari bawah secara berperingkat (React Bits AnimatedContent).
export function Reveal({ children, index = 0, distance = 40, className, ...rest }) {
  if (REDUCED_MOTION) return <div className={className}>{children}</div>;
  return (
    <AnimatedContent distance={distance} duration={0.6} delay={index * 0.07}
      threshold={0} className={className} {...rest}>
      {children}
    </AnimatedContent>
  );
}

// Butang utama dengan bintang beredar di bingkai (React Bits StarBorder).
export function GlowButton({ children, className = '', ...rest }) {
  return (
    <StarBorder as="button" className={'glow-button ' + className} {...rest}
      color="#fde68a" speed="3s" thickness={3}
      backgroundColor="var(--primary)" textColor="var(--primary-foreground)" borderColor="transparent">
      {children}
    </StarBorder>
  );
}

// Gambar profil Google, atau huruf awal nama (tetamu: ikon orang).
export function Avatar({ user, size = 32 }) {
  const style = { width: size, height: size, fontSize: size * 0.45 };
  if (user.photo) {
    return <img className="avatar" src={user.photo} alt="" style={style} referrerPolicy="no-referrer" />;
  }
  return (
    <span className={'avatar' + (user.isGuest ? ' avatar-guest' : '')} style={style} aria-hidden="true">
      {user.isGuest ? <Icon name="user" /> : user.name.charAt(0).toUpperCase()}
    </span>
  );
}

// Butang rasmi gaya Google.
export function GoogleButton({ children, className = '', ...rest }) {
  return (
    <button className={'btn btn-lg btn-google ' + className} {...rest}>
      <svg viewBox="0 0 48 48" className="google-logo" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      <span>{children}</span>
    </button>
  );
}

// Peringatan untuk tetamu: pautkan akaun Google supaya kemajuan tidak hilang.
export function LinkReminder({ onLink, compact = false }) {
  return (
    <div className={'link-reminder' + (compact ? ' is-compact' : '')} role="note">
      <span className="link-reminder-icon" aria-hidden="true">⚠️</span>
      <div className="link-reminder-body">
        <p className="link-reminder-title">Kemajuan anda belum selamat!</p>
        {!compact && (
          <p className="link-reminder-text">
            Anda bermain sebagai <b>tetamu</b>. Jika telefon ditukar atau data pelayar dipadam, semua markah dan pencapaian akan hilang.
            Minta ibu, ayah atau guru tolong pautkan akaun Google.
          </p>
        )}
        <GoogleButton className="btn-google-sm" onClick={onLink}>Pautkan akaun Google</GoogleButton>
      </div>
    </div>
  );
}
