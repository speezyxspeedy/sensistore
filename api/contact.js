import { sendContactMessage } from './_lib/email.js'
import { allowMethod, clientIp, sendError, setSecurityHeaders } from './_lib/http.js'
import { rateLimit } from './_lib/rateLimit.js'

export default async function handler(request, response) {
  if (!allowMethod(request, response, 'POST')) return
  try {
    await rateLimit(`contact:${clientIp(request)}`, { limit: 3, windowSeconds: 3600 })
    const { name, email, message } = request.body || {}
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 120 || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof message !== 'string' || message.trim().length < 10 || message.length > 2000) throw Object.assign(new Error('Please enter valid contact details.'), { statusCode: 400 })
    await sendContactMessage({ name: name.trim(), email: email.trim(), message: message.trim() })
    setSecurityHeaders(response); response.status(200).json({ success: true })
  } catch (error) { sendError(response, error) }
}
