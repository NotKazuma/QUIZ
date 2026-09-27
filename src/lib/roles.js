// Peranan pengguna. Admin ditentukan oleh emel Google (mesti sama dengan firestore.rules).
export const ADMIN_EMAILS = ['aimanskspp@gmail.com'];

export function isAdmin(user) {
  return Boolean(user && !user.isGuest && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}

// Cikgu = peranan 'teacher' yang ditetapkan admin (admin juga boleh guna ciri cikgu).
export function isTeacher(user, role) {
  return isAdmin(user) || role === 'teacher';
}
