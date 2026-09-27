// Navigasi antara skrin dan paparan menu.

const state = {
  config: null,
  exam: null,
  subject: null,
  questions: [], // semua soalan subjek yang dipilih
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== id; });
  window.scrollTo(0, 0);
}

function makeButton(label, onClick, className) {
  const btn = document.createElement('button');
  btn.className = className || 'btn';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

// Kad boleh tekan: ikon/label kecil di kiri, tajuk + keterangan, anak panah di kanan.
function makeCard({ icon, title, desc, onClick, className }) {
  const btn = document.createElement('button');
  btn.className = 'card card-button ' + (className || '');

  const iconEl = document.createElement('span');
  iconEl.className = 'card-icon';
  iconEl.setAttribute('aria-hidden', 'true');
  if (icon.startsWith('<svg')) iconEl.innerHTML = icon;
  else iconEl.textContent = icon;

  const text = document.createElement('span');
  text.className = 'card-text';
  const t = document.createElement('span');
  t.className = 'card-title';
  t.textContent = title;
  const d = document.createElement('span');
  d.className = 'card-desc';
  d.textContent = desc || '';
  text.append(t, d);

  btn.append(iconEl, text);
  btn.insertAdjacentHTML('beforeend',
    '<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>');
  btn.addEventListener('click', onClick);
  return { btn, desc: d };
}

const EXAM_DESC = {
  upkk: 'Ujian Penilaian Kelas al-Quran dan Fardu Ain',
  sdea: 'Sijil Darjah Enam Agama',
};

// Ikon (gaya Lucide) bagi setiap peperiksaan.
const EXAM_ICON = {
  upkk: '<svg viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="m9 9.5 2 2 4-4"/></svg>',
  sdea: '<svg viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>',
};

function showError(containerId, message) {
  const list = document.getElementById(containerId);
  list.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'alert';
  p.textContent = message;
  list.appendChild(p);
}

// --- Halaman Utama ---
async function init() {
  try {
    const res = await fetch('data/config.json');
    state.config = await res.json();
  } catch (e) {
    showError('exam-list', 'Tidak dapat memuat config.json. Pastikan laman dijalankan melalui pelayan (contoh: npx serve).');
    return;
  }

  const list = document.getElementById('exam-list');
  state.config.exams.forEach(exam => {
    const { btn } = makeCard({
      icon: EXAM_ICON[exam.id] || exam.name,
      title: exam.name,
      desc: (EXAM_DESC[exam.id] || '') + ' · ' + exam.subjects.length + ' subjek',
      onClick: () => selectExam(exam),
      className: 'exam-card',
    });
    list.appendChild(btn);
  });
}

function selectExam(exam) {
  state.exam = exam;
  document.getElementById('mode-badge').textContent = exam.name;
  document.getElementById('subject-badge').textContent = exam.name;
  showScreen('screen-mode');
}

// --- Pilih Subjek ---
function showSubjects() {
  const list = document.getElementById('subject-list');
  list.innerHTML = '';
  state.exam.subjects.forEach((subject, i) => {
    const card = makeCard({
      icon: String(i + 1),
      title: subject.name,
      desc: 'Memuatkan…',
      onClick: () => selectSubject(subject),
    });
    list.appendChild(card.btn);
    // Bilangan soalan dimuat di belakang tabir.
    loadQuestions(subject.file)
      .then(qs => {
        const n = qs.filter(q => q.type === 'objektif').length;
        card.desc.textContent = n ? n + ' soalan' : 'Tiada soalan lagi';
      })
      .catch(() => { card.desc.textContent = 'Ralat memuat soalan'; });
  });
  showScreen('screen-subject');
}

// --- Pilih Topik ---
async function selectSubject(subject) {
  state.subject = subject;
  document.getElementById('topic-title').textContent = subject.name + ': pilih topik';
  const list = document.getElementById('topic-list');
  const msg = document.getElementById('topic-message');
  list.innerHTML = '';
  msg.hidden = true;
  showScreen('screen-topic');

  try {
    // Buat masa ini hanya soalan objektif (subjektif pada Fasa 5).
    state.questions = (await loadQuestions(subject.file)).filter(q => q.type === 'objektif');
  } catch (e) {
    state.questions = [];
    msg.textContent = 'Ralat: ' + e.message;
    msg.hidden = false;
    return;
  }

  if (state.questions.length === 0) {
    msg.textContent = 'Tiada soalan lagi untuk subjek ini.';
    msg.hidden = false;
    return;
  }

  // Senarai topik unik, mengikut susunan dalam fail.
  const topics = [...new Set(state.questions.map(q => q.topic))];

  // Soalan tidak diasingkan mengikut bab: terus mula latihan.
  if (topics.length === 1) {
    startQuiz(state.questions);
    return;
  }

  list.appendChild(makeButton(
    'Semua topik (' + state.questions.length + ')',
    () => startQuiz(state.questions),
    'btn btn-primary'
  ));
  topics.forEach(topic => {
    const qs = state.questions.filter(q => q.topic === topic);
    list.appendChild(makeButton(topic + ' (' + qs.length + ')', () => startQuiz(qs)));
  });
}

// --- Butang tetap ---
document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.back));
});
document.getElementById('btn-practice').addEventListener('click', showSubjects);
document.getElementById('btn-next').addEventListener('click', nextQuestion);
document.getElementById('btn-quit').addEventListener('click', () => {
  if (confirm('Berhenti latihan ini?')) showScreen('screen-subject');
});
document.getElementById('btn-retry').addEventListener('click', () => startQuiz(quiz.source));
document.getElementById('btn-home').addEventListener('click', () => showScreen('screen-home'));
document.getElementById('btn-subjects').addEventListener('click', showSubjects);

init();
