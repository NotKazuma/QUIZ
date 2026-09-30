# Handoff — Kuiz Ulang Kaji

Nota serah tugas untuk sesi Claude Code yang baharu. Baca fail ini dahulu sebelum menyambung kerja.

## Projek

Laman kuiz ulang kaji sekolah agama dalam bahasa Melayu (soalan objektif, tulisan Jawi dan Arab).

- Stack: React + Vite, Firebase Firestore Lite (tiada Firebase Storage), hos di GitHub Pages.
- Laman langsung: https://kuiz.kazumadigital.net
- Repo: `NotKazuma/QUIZ`, cawangan `main`.
- Direktori kerja: `C:\Users\Administrator\Documents\PROJECT\WEBSITE QUIZ`
- Admin: aimanskspp@gmail.com

## Peraturan yang mesti dipatuhi

1. **Jangan sekali-kali commit folder `soalan/` ke repo utama** (kertas peperiksaan asal, hak cipta sekolah; repo utama adalah awam). Kertas asal disimpan dalam repo **peribadi** berasingan `NotKazuma/QUIZ-soalan` — folder `soalan/` ialah repo git tersendiri dan kekal di-gitignore oleh repo utama.
2. **Jangan sekali-kali commit token atau kunci.** Token bot Telegram ada di `~/.claude/channels/telegram/.env`; fail service-account JSON sudah di-gitignore. Jangan salin nilainya ke mana-mana fail dalam repo.
3. **Commit dan push ke `main` secara automatik** sebaik sahaja perubahan siap dan diuji — pengguna tidak mahu ditanya setiap kali.
4. Balas dalam bahasa Melayu. Gaya ringkas (skill `caveman` aktif dalam sesi sebelum ini).
5. Untuk soalan peperiksaan: **tukar set yang lengkap sahaja** (semua subjek bagi set itu ada). Tulis jawapan sendiri, tetapi tandakan setiap soalan `perlu_semak: true` supaya cikgu boleh semak kemudian. Soalan yang kabur (esei, imej tidak terbaca, bank padanan yang rosak) **dilangkau**, jangan teka.

## Saluran data soalan

```
soalan/DARJAH <n>/<PEPERIKSAAN>/<TAHUN>/*.pdf     (sumber; repo peribadi QUIZ-soalan)
  → data-src/<exam>/<subjek>/<SET>-<TAHUN>.json   (hasil penukaran, di-commit)
  → python scripts/build_questions.py
  → public/data/darjah-<n>/<subjek>.json + public/data/config.json
```

Bentuk satu soalan dalam `data-src`:

```json
{ "q": "teks soalan", "o": ["pilihan A", "B", "C", "D"], "a": 0, "e": "penerangan", "img": "laluan/gambar.png", "s": "arab" }
```

`build_questions.py` menambah `perlu_semak: true`, `type: "objektif"` dan `script` (lalai `jawi`; guna `"s": "arab"` untuk teks Arab).

### Skrip penting

| Skrip | Guna |
|---|---|
| `scripts/build_questions.py` | Bina `public/data/` daripada `data-src/` |
| `scripts/crop_images.py` | Potong gambar daripada PDF. Kotak dalam piksel 90 dpi, output 200 dpi. **Melangkau jika fail output sudah wujud** — padam fail itu dahulu untuk potong semula |
| `scripts/semak_jawi.py` | Semak ejaan Jawi merentas semua `data-src`. `--baiki` membetulkan huruf varian Parsi/Urdu secara automatik |
| `scripts/sort_soalan.py` | Susun PDF yang dimuat turun daripada Telegram ke struktur folder `soalan/` |
| `scripts/telegram_download.py` | Muat turun kertas daripada group Telegram "SOALAN" |

### Perangkap yang pernah berlaku

- **Nombor halaman PDF tersasar satu** apabila PDF tiada muka depan. Sahkan dengan contact sheet sebelum potong semua.
- **Saiz halaman tidak seragam:** kebanyakan halaman render 744×1053 pada 90 dpi, tetapi ada yang 2685×3750. Jangan teka koordinat — guna `grid.py` dalam scratchpad untuk membaca koordinat sebenar daripada PNG yang dirender.
- **Jangan tulis skrip yang mengandungi teks Jawi melalui heredoc bash** — petikan akan rosak. Guna alat Write.
- **Peta penggantian rentetan Jawi berbahaya:** perkataan pendek ialah subrentetan perkataan panjang (`باݢين` di dalam `باݢيندا`). Sentiasa audit semula selepas setiap pusingan pembetulan.
- Nama Arab tidak mengikut peraturan ejaan Melayu (`فهيرة` kekal dengan ف, bukan ڤ). `semak_jawi.py` ada senarai putih `GHAIN_OK` dan `FA_OK`.

## Ejaan Jawi — huruf yang sering keliru

- ڠ (nga) / ݢ (ga) / غ (ghain)
- ڤ (pa) / ف (fa)
- ك Arab / ک Parsi — guna yang Arab
- ي Arab / ی Parsi — guna yang Arab

Kira-kira 4,400 pembetulan telah dibuat merentas semua darjah dalam sesi lepas. `scripts/semak_jawi.py` kekal untuk semakan berterusan.

## Ciri aplikasi yang baru siap

- **Muat naik gambar untuk cikgu** — `src/components/ImageField.jsx` + `src/lib/imageUpload.js`. Mampatan di sebelah klien melalui canvas (maksimum 900 px, sasaran 120 KB, had keras 220 KB), disimpan sebagai data URL dalam Firestore (had dokumen 1 MB; tiada Firebase Storage). Diuji: PNG 4.6 MB → JPEG 17 KB. `assetUrl()` dalam `src/lib/quiz.js` sudah menerima `data:`/`blob:`/`http:`.
- **Panel murid terperinci untuk cikgu** — `src/screens/teacher/StudentDetail.jsx`, 5 tab: Ringkasan, Subjek, Kerja rumah, Soalan salah, Garis masa. Dibuka daripada `ClassDetail.jsx`.
- **Panel pengguna terperinci untuk admin** — `src/screens/admin/AdminUserDetail.jsx`, 7 tab: Profil, Prestasi, Subjek, Cabaran & main, Dompet, Pencapaian, Data mentah. Dibuka daripada `AdminUsers.jsx`. Commit `556d1d2`.

### Corak yang perlu dikekalkan

- **Suntikan kebergantungan** untuk komponen yang membaca Firestore: terima prop `api = API` supaya boleh dipratonton tanpa Firestore. Modul ES tidak boleh ditampal (immutable) — jangan cuba ganti fungsi yang diimport.
- **Pratonton pembangunan sahaja** didaftarkan dalam `src/main.jsx` di bawah `if (!import.meta.env.DEV) return null;`. Tanpa penjaga itu Vite gagal membuktikan import dinamik mati dan bahagian pratonton akan masuk ke `dist/`. Buka `http://localhost:5173/?preview=student`, `?preview=admin`, `?preview=image`.
- **Token CSS yang wujud:** `--card`, `--muted`, `--muted-foreground`, `--correct`, `--wrong`. `--muted` ialah warna **latar belakang**, bukan warna teks — pernah menyebabkan label hampir tidak kelihatan dalam mod gelap. Tiada `--surface`, `--surface-2`, `--ok`, `--danger`.
- **Sahkan UI dalam pelayar sebenar**, bukan sekadar `vite build`. Skrip CDP headless (WebSocket, tanpa pakej tambahan) dalam scratchpad sesi lepas menangkap dua pepijat yang binaan tidak nampak: kontras mod gelap dan ranap `ctx.config` dalam senarai pencapaian.
- Beberapa entri `ACHIEVEMENTS` mempunyai tandatangan `(s, ctx)` dan membaca `ctx.config` / `ctx.user`. Bina objek `ctx` dan balut panggilan `a.progress()` dalam `try/catch`.

## Model data Firestore

```
users/{uid}                                   stats, unlocked, session, role, classes, teacherRequest, profile
classes/{cid}/members/{uid}                   summary, subjects, avatar, lastActive
classes/{cid}/assignments/{aid}/submissions/{uid}
```

Fungsi pembantu dalam `src/lib/classes.js`: `listStudentSubmissions`, `classAverages`, `updateMemberSummary`.

## Kerja yang masih berbaki

### 1. Tukar set kertas yang belum siap

Sudah siap: Darjah 1 dan 2 (penuh), Darjah 3 (10 set), Darjah 4 PAT 2022, PAT 2024, PAT 2025, PPT 2024, PPT 2025.

Masih berbaki (set lengkap sahaja — set tak lengkap dilangkau):

- Darjah 3 — UPP2 2022
- Darjah 4 — PAT 2023, PPT 2026
- Darjah 5 — PAT 2022, PAT 2023, PAT 2024, PAT 2025, PPT 2022, PPT 2024, PPT 2025, PPT 2026

Set seterusnya mengikut turutan: **Darjah 4 PPT 2026**.

Aliran kerja per set (skrip pembantu ada dalam folder scratchpad sesi):

```bash
python render.py 4/PAT/2022          # render halaman PDF ke PNG pada 90 dpi
# baca soalan daripada PNG, tulis data-src/darjah-4/<subjek>/PAT-2022.json
bash next.sh "Darjah 4 PAT 2022 lengkap (perlu semak)" 4/PPT/2024
# next.sh = crop → build → vite build → git add → commit → push → render set berikut
```

Skrip scratchpad (`render.py`, `next.sh`, `grid.py`, `sheet.py`) tidak di-commit. Jika hilang, tulis semula — semuanya nipis dan bersandar pada `pdftoppm` serta skrip dalam `scripts/`.

### 2. Ditangguh oleh pengguna

- Deploy Cloudflare Worker anti-tipu (kod ada dalam `worker/`).
- Pengguna perlu menerbitkan `firestore.rules` dan `database.rules.json` sendiri melalui konsol Firebase.

## Arahan mula untuk sesi baharu

```bash
cd "C:\Users\Administrator\Documents\PROJECT\WEBSITE QUIZ"
git pull
python scripts/semak_jawi.py     # sepatutnya bersih
npm run dev                      # http://localhost:5173
```
