// Panel admin: urus pengguna (tetapkan cikgu) dan soalan.
import { useState } from 'react';
import { BackButton, PageHead } from '../../components/ui.jsx';
import AdminQuestions from './AdminQuestions.jsx';
import AdminUsers from './AdminUsers.jsx';
import MySets from '../teacher/MySets.jsx';
import { EmojiText } from '../../components/Emoji.jsx';

const TABS = [
  { id: 'users', label: '👥 Pengguna' },
  { id: 'questions', label: '📝 Bank rasmi' },
  { id: 'sets', label: '✍️ Soalan cikgu' },
];

export default function Admin({ user, config, onBack }) {
  const [tab, setTab] = useState('users');
  return (
    <section className="screen admin">
      <BackButton onClick={onBack} />
      <PageHead badge="Admin" title="Panel Admin" />
      <div className="tabs" role="tablist">
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            className={'tab' + (tab === t.id ? ' is-active' : '')} onClick={() => setTab(t.id)}>
            <EmojiText>{t.label}</EmojiText>
          </button>
        ))}
      </div>
      {tab === 'users' && <AdminUsers me={user} config={config} />}
      {tab === 'questions' && <AdminQuestions me={user} config={config} />}
      {tab === 'sets' && <MySets user={user} config={config} allSets />}
    </section>
  );
}
