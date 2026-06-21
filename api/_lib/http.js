export function setSecurityHeaders(response) {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'no-referrer')
}

export function sendError(response, error) {
  console.error(error)
  setSecurityHeaders(response)
  response.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Something went wrong.' })
}

export function allowMethod(request, response, method) {
  if (request.method === method) return true
  response.setHeader('Allow', method)
  response.status(405).json({ error: 'Method not allowed.' })
  return false
}

export function clientIp(request) {
  return String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim()
}
