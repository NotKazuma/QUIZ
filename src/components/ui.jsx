// Komponen asas gaya shadcn: ikon, kad tindakan, lencana, bar kemajuan.
import SpotlightCard from './bits/SpotlightCard.jsx';

// Ikon gaya Lucide (laluan SVG 24x24).
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
  upkk: <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /><path d="m9 9.5 2 2 4-4" /></>,
  sdea: <><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>,
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
export function ActionCard({ icon, title, desc, onClick, disabled, soon, className = '' }) {
  const iconNode = ICONS[icon] ? <Icon name={icon} /> : icon;
  return (
    <SpotlightCard
      className={'card action-card ' + (disabled ? 'is-disabled ' : '') + className}
      spotlightColor="rgba(20, 184, 166, 0.22)"
    >
      <button className="card-button" onClick={onClick} disabled={disabled}>
        <span className={'card-icon' + (disabled ? ' icon-muted' : '')} aria-hidden="true">{iconNode}</span>
        <span className="card-text">
          <span className="card-title">{title}</span>
          {desc && <span className="card-desc">{desc}</span>}
        </span>
        {soon ? <Badge variant="outline">Akan datang</Badge> : <Icon name="chevron" className="chevron" />}
      </button>
    </SpotlightCard>
  );
}
