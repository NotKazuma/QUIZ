// Peranan pengguna. Mesti sepadan dengan firestore.rules.
//
// - Admin: emel Google dalam ADMIN_EMAILS.
// - Cikgu automatik: akaun DELIMa KPM guru (g-…@moe-dl.edu.my). Akaun murid DELIMa bermula dengan "m-".
// - Cikgu lain: mohon melalui laman, kemudian admin luluskan (role = 'teacher').
export const ADMIN_EMAILS = ['aimanskspp@gmail.com'];
export const TEACHER_EMAIL_PATTERN = /^g-[^@]+@moe-dl\.edu\.my$/i;

export function isAdmin(user) {
  return Boolean(user && !user.isGuest && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}

export function isVerifiedTeacherEmail(user) {
  return Boolean(user && !user.isGuest && user.email && TEACHER_EMAIL_PATTERN.test(user.email));
}

export function isTeacher(user, role) {
  return isAdmin(user) || role === 'teacher' || isVerifiedTeacherEmail(user);
}

// Sebab seseorang cikgu (untuk dipaparkan).
export function teacherBasis(user, role) {
  if (isAdmin(user)) return 'admin';
  if (isVerifiedTeacherEmail(user)) return 'delima';
  if (role === 'teacher') return 'approved';
  return null;
}
