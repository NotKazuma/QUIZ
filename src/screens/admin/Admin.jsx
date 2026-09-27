// Panel admin: urus pengguna (tetapkan cikgu) dan soalan.
import { useState } from 'react';
import { BackButton, PageHead } from '../../components/ui.jsx';
import AdminQuestions from './AdminQuestions.jsx';
import AdminUsers from './AdminUsers.jsx';

const TABS = [
  { id: 'users', label: '👥 Pengguna' },
  { id: 'questions', label: '📝 Soalan' },
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
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'users' && <AdminUsers me={user} />}
      {tab === 'questions' && <AdminQuestions me={user} config={config} />}
    </section>
  );
}
