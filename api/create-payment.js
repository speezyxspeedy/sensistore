import { requireUser } from './_lib/firebaseAdmin.js'
import { allowMethod, sendError, setSecurityHeaders } from './_lib/http.js'

// Gateway placeholder. Implement the selected provider here; merchant secrets must
// be read only from server environment variables and provider signatures must be
// verified before any order is marked Paid.
export default async function handler(request, response) {
  if (!allowMethod(request, response, 'POST')) return
  try {
    await requireUser(request)
    setSecurityHeaders(response)
    response.status(501).json({
      error: 'Online payment is not enabled yet. Use manual UPI mode while BharatPe or Razorpay credentials are configured on the server.',
    })
  } catch (error) {
    sendError(response, error)
  }
}
