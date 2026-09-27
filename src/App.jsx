// Navigasi antara skrin: Utama → Mod → Subjek → Tahun → Kuiz → Keputusan.
import { useEffect, useState } from 'react';
import { loadConfig, loadQuestions, objectiveOnly } from './lib/quiz.js';
import { Icon } from './components/ui.jsx';
import Home from './screens/Home.jsx';
import ModeSelect from './screens/ModeSelect.jsx';
import SubjectSelect from './screens/SubjectSelect.jsx';
import YearSelect from './screens/YearSelect.jsx';
import Quiz from './screens/Quiz.jsx';
import Result from './screens/Result.jsx';

export default function App() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState('home');
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [subjectQuestions, setSubjectQuestions] = useState(null); // null = sedang dimuat
  const [quizSet, setQuizSet] = useState([]);   // soalan asal untuk sesi kuiz semasa
  const [quizRun, setQuizRun] = useState(0);    // tukar untuk mula semula kuiz
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch(() => setError('Tidak dapat memuat config.json. Pastikan laman dijalankan melalui pelayan (contoh: npm run dev).'));
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  function go(next) { setScreen(next); }

  async function openSubject(s) {
    setSubject(s);
    setSubjectQuestions(null);
    go('years');
    try {
      setSubjectQuestions(objectiveOnly(await loadQuestions(s.file)));
    } catch (e) {
      setSubjectQuestions({ error: e.message });
    }
  }

  function startQuiz(questions) {
    setQuizSet(questions);
    setQuizRun(n => n + 1);
    go('quiz');
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true"><Icon name="book" /></span>
            Kuiz UPKK &amp; SDEA
          </span>
        </div>
      </header>

      <main className="container">
        {screen === 'home' && (
          <Home config={config} error={error}
            onSelectExam={e => { setExam(e); go('mode'); }} />
        )}
        {screen === 'mode' && (
          <ModeSelect exam={exam} onBack={() => go('home')} onPractice={() => go('subjects')} />
        )}
        {screen === 'subjects' && (
          <SubjectSelect exam={exam} onBack={() => go('mode')} onSelect={openSubject} />
        )}
        {screen === 'years' && (
          <YearSelect subject={subject} questions={subjectQuestions}
            onBack={() => go('subjects')} onStart={startQuiz} />
        )}
        {screen === 'quiz' && (
          <Quiz key={quizRun} questions={quizSet}
            onQuit={() => go('years')}
            onFinish={r => { setResult(r); go('result'); }} />
        )}
        {screen === 'result' && result && (
          <Result result={result}
            onRetry={() => startQuiz(quizSet)}
            onSubjects={() => go('subjects')}
            onHome={() => go('home')} />
        )}
      </main>
    </>
  );
}
