const LOCKED_ADMIN_EMAIL = 'bglspeedy@gmail.com'
const configuredAdminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || LOCKED_ADMIN_EMAIL)
  .replace(/^mailto:/i, '')
  .trim()
  .toLowerCase()

// Keep the administrator email locked even if the environment value is changed.
export const ADMIN_EMAIL = configuredAdminEmail === LOCKED_ADMIN_EMAIL
  ? configuredAdminEmail
  : LOCKED_ADMIN_EMAIL

export function isAdmin(user) {
  return Boolean(user?.email?.trim().toLowerCase() === ADMIN_EMAIL)
}
