export const ADMIN_EMAIL = 'bglspeedy@gmail.com'

export const isAdmin = (user) => {
  return user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}
