import { requireUser } from './_lib/firebaseAdmin.js'
import { allowMethod, sendError, setSecurityHeaders } from './_lib/http.js'

// Gateway placeholder. A future implementation must fetch/verify the transaction
// server-side and compare the signed order ID, amount, currency and payment status.
export default async function handler(request, response) {
  if (!allowMethod(request, response, 'POST')) return
  try {
    await requireUser(request)
    setSecurityHeaders(response)
    response.status(501).json({
      error: 'Automatic verification is not enabled yet. Manual payments require admin review.',
    })
  } catch (error) {
    sendError(response, error)
  }
}
