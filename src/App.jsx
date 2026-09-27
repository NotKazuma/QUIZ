// Navigasi antara skrin: Utama → Mod → Tahun → Subjek → Kuiz → Keputusan.
import { useEffect, useState } from 'react';
import { loadConfig } from './lib/quiz.js';
import { Icon, REDUCED_MOTION } from './components/ui.jsx';
import ClickSpark from './components/bits/ClickSpark.jsx';
import GradientText from './components/bits/GradientText.jsx';
import Particles from './components/bits/Particles.jsx';
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
  const [year, setYear] = useState(null);       // null = semua tahun
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

  function startQuiz(questions) {
    setQuizSet(questions);
    setQuizRun(n => n + 1);
    go('quiz');
  }

  return (
    <>
      {/* Zarah terapung di belakang semua skrin (React Bits Particles) */}
      {!REDUCED_MOTION && (
        <div className="page-bg" aria-hidden="true">
          <Particles particleColors={['#14b8a6', '#2dd4bf', '#f59e0b', '#fcd34d']}
            particleCount={160} particleSpread={10} speed={0.08} particleBaseSize={260}
            alphaParticles disableRotation={false} />
        </div>
      )}

      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true"><Icon name="book" /></span>
            <GradientText colors={['#14b8a6', '#2dd4bf', '#f59e0b', '#14b8a6']} animationSpeed={6}>
              Kuiz UPKK &amp; SDEA
            </GradientText>
          </span>
        </div>
      </header>

      {/* Percikan kecil pada setiap sentuhan (React Bits ClickSpark) */}
      <ClickSpark sparkColor="#14b8a6" sparkSize={8} sparkRadius={22} sparkCount={8} duration={400}>
      <main className="container">
        {screen === 'home' && (
          <Home config={config} error={error}
            onSelectExam={e => { setExam(e); go('mode'); }} />
        )}
        {screen === 'mode' && (
          <ModeSelect exam={exam} onBack={() => go('home')} onPractice={() => go('years')} />
        )}
        {screen === 'years' && (
          <YearSelect exam={exam} onBack={() => go('mode')}
            onSelect={y => { setYear(y); go('subjects'); }} />
        )}
        {screen === 'subjects' && (
          <SubjectSelect exam={exam} year={year} onBack={() => go('years')}
            onSelect={(s, questions) => startQuiz(questions)} />
        )}
        {screen === 'quiz' && (
          <Quiz key={quizRun} questions={quizSet}
            onQuit={() => go('subjects')}
            onFinish={r => { setResult(r); go('result'); }} />
        )}
        {screen === 'result' && result && (
          <Result result={result}
            onRetry={() => startQuiz(quizSet)}
            onSubjects={() => go('subjects')}
            onHome={() => go('home')} />
        )}
      </main>
      </ClickSpark>
    </>
  );
}
