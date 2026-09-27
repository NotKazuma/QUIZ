import { ActionCard, BackButton, PageHead, Reveal } from '../components/ui.jsx';

export default function ModeSelect({ exam, onBack, onPractice, onChallenge }) {
  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge={exam?.name} title="Pilih mod" />
      <div className="card-list">
        <Reveal index={0}>
          <ActionCard icon="pencil" title="Latihan"
            desc="Jawab soalan dan terus lihat jawapan betul" onClick={onPractice} />
        </Reveal>
        <Reveal index={1}>
          <ActionCard className="challenge-card" icon="bolt" title="Cabaran"
            desc="Gaya Quizizz: berlumba dengan masa, kumpul mata & tebus markah" onClick={onChallenge} />
        </Reveal>
        <Reveal index={2}>
          <ActionCard icon="clock" title="Ujian Bermasa"
            desc="Seperti peperiksaan sebenar" disabled soon />
        </Reveal>
      </div>
    </section>
  );
}
