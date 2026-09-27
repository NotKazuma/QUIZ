import { ActionCard, BackButton, PageHead } from '../components/ui.jsx';

export default function ModeSelect({ exam, onBack, onPractice }) {
  return (
    <section className="screen">
      <BackButton onClick={onBack} />
      <PageHead badge={exam?.name} title="Pilih mod" />
      <div className="card-list">
        <ActionCard icon="pencil" title="Latihan"
          desc="Jawab soalan dan terus lihat jawapan betul" onClick={onPractice} />
        <ActionCard icon="clock" title="Ujian Bermasa"
          desc="Seperti peperiksaan sebenar" disabled soon />
      </div>
    </section>
  );
}
