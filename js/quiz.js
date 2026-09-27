// Logik kuiz: muat soalan, kocok, papar dan semak jawapan.

const quiz = {
  questions: [], // soalan yang telah disediakan (pilihan dikocok)
  current: 0,
  score: 0,
  source: [],    // soalan asal, untuk "Ulang latihan"
};

// Muat fail soalan. Pulangkan array kosong jika fail tiada.
// Baling ralat jika fail wujud tetapi JSON rosak.
async function loadQuestions(file) {
  const res = await fetch(file);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('Gagal memuat ' + file + ' (' + res.status + ')');
  try {
    return await res.json();
  } catch (e) {
    throw new Error('Format JSON tidak sah dalam ' + file);
  }
}

// Kocok array (Fisher–Yates). Pulangkan salinan baharu.
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Buat salinan soalan dengan pilihan dikocok dan indeks `answer` dikemas kini.
function prepareQuestion(q) {
  const opts = shuffle(q.options.map((text, i) => ({ text, isCorrect: i === q.answer })));
  return {
    ...q,
    options: opts.map(o => o.text),
    answer: opts.findIndex(o => o.isCorrect),
  };
}

// Label pilihan jawapan (A, B, C… atau ا، ب، ج… bagi soalan Jawi/Arab).
const KEYS_RUMI = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const KEYS_ARABIC = ['ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي'];

// Ikon SVG (gaya Lucide) untuk betul/salah.
const ICON_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

// Tetapkan arah teks dan fon mengikut medan `script`.
function applyScript(el, script) {
  el.classList.remove('script-arabic', 'script-mixed');
  if (script === 'jawi' || script === 'arab') {
    el.dir = 'rtl';
    el.classList.add('script-arabic');
  } else if (script === 'campur') {
    el.dir = 'auto';
    el.classList.add('script-mixed');
  } else {
    el.dir = 'ltr';
  }
}

function startQuiz(questions) {
  quiz.source = questions;
  quiz.questions = shuffle(questions).map(prepareQuestion);
  quiz.current = 0;
  quiz.score = 0;
  showScreen('screen-quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = quiz.questions[quiz.current];

  document.getElementById('quiz-counter').textContent =
    (quiz.current + 1) + '/' + quiz.questions.length;
  document.getElementById('quiz-progress').style.width =
    (quiz.current / quiz.questions.length * 100) + '%';
  document.getElementById('quiz-subject').textContent = q.exam + ' · ' + q.subject + (q.source ? ' · ' + q.source.replace(/\D+/g, '') : '');

  const questionEl = document.getElementById('quiz-question');
  questionEl.textContent = q.question;
  applyScript(questionEl, q.script);

  const img = document.getElementById('quiz-image');
  if (q.image) {
    img.src = q.image;
    img.hidden = false;
  } else {
    img.removeAttribute('src');
    img.hidden = true;
  }

  const optionsEl = document.getElementById('quiz-options');
  optionsEl.innerHTML = '';
  applyScript(optionsEl, q.script);
  const keys = (q.script === 'jawi' || q.script === 'arab') ? KEYS_ARABIC : KEYS_RUMI;
  q.options.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    const key = document.createElement('span');
    key.className = 'option-key';
    key.textContent = keys[i] || String(i + 1);
    const label = document.createElement('span');
    label.className = 'option-text';
    label.textContent = text;
    btn.append(key, label);
    btn.addEventListener('click', () => selectAnswer(i));
    optionsEl.appendChild(btn);
  });

  document.getElementById('quiz-feedback').hidden = true;
  document.getElementById('btn-next').hidden = true;
  window.scrollTo(0, 0);
}

function selectAnswer(chosen) {
  const q = quiz.questions[quiz.current];
  const correct = chosen === q.answer;
  if (correct) quiz.score++;

  const buttons = document.querySelectorAll('#quiz-options .option');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    const key = btn.querySelector('.option-key');
    if (i === q.answer) {
      btn.classList.add('correct');
      key.innerHTML = ICON_CHECK;
    } else if (i === chosen) {
      btn.classList.add('wrong');
      key.innerHTML = ICON_X;
    }
  });

  showFeedback(q, correct);

  const nextBtn = document.getElementById('btn-next');
  nextBtn.textContent = quiz.current < quiz.questions.length - 1 ? 'Seterusnya' : 'Lihat markah';
  nextBtn.hidden = false;
  document.getElementById('quiz-progress').style.width =
    ((quiz.current + 1) / quiz.questions.length * 100) + '%';
  document.getElementById('quiz-feedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Tunjuk betul/salah, dan penerangan jika ada; jika tiada, jawapan betul sahaja.
function showFeedback(q, correct) {
  const fb = document.getElementById('quiz-feedback');
  fb.innerHTML = '';
  fb.className = 'feedback ' + (correct ? 'correct' : 'wrong');

  const iconEl = document.createElement('span');
  iconEl.className = 'feedback-icon';
  iconEl.innerHTML = correct ? ICON_CHECK : ICON_X;

  const wrap = document.createElement('div');
  wrap.className = 'feedback-body';
  const title = document.createElement('p');
  title.className = 'feedback-title';
  title.textContent = correct ? 'Betul! Syabas.' : 'Salah';
  wrap.appendChild(title);

  const body = document.createElement('p');
  if (q.explanation && q.explanation.trim()) {
    body.textContent = q.explanation;
  } else {
    body.textContent = 'Jawapan betul: ' + q.options[q.answer];
  }
  body.dir = 'auto';
  if (q.script !== 'rumi') body.classList.add('script-mixed');
  wrap.appendChild(body);
  fb.append(iconEl, wrap);

  fb.hidden = false;
}

function nextQuestion() {
  quiz.current++;
  if (quiz.current < quiz.questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
}

// Skrin keputusan ringkas (senarai soalan salah pada Fasa 2).
function showResult() {
  const total = quiz.questions.length;
  const percent = Math.round((quiz.score / total) * 100);
  let emoji = '💪', title = 'Teruskan usaha!';
  if (percent >= 80) { emoji = '🌟'; title = 'Cemerlang!'; }
  else if (percent >= 60) { emoji = '👍'; title = 'Bagus!'; }

  document.getElementById('done-emoji').textContent = emoji;
  document.getElementById('done-title').textContent = title;
  document.getElementById('done-subject').textContent =
    quiz.questions[0].exam + ' · ' + quiz.questions[0].subject;
  document.getElementById('done-percent').textContent = percent + '%';
  document.getElementById('done-score').textContent = quiz.score + ' daripada ' + total + ' betul';
  document.getElementById('done-progress').style.width = '0';
  showScreen('screen-done');
  requestAnimationFrame(() => {
    document.getElementById('done-progress').style.width = percent + '%';
  });
}
