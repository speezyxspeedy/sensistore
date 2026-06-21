const plans = { normal: { name: 'Normal Sensi', amount: 199 }, premium: { name: 'Premium Sensi', amount: 499 } }
const textFields = ['customerName', 'email', 'phone', 'deviceName', 'deviceModel', 'ram', 'androidVersion', 'gameName']

export function validateOrder(input, user) {
  if (!input || typeof input !== 'object') throw badRequest('Invalid order payload.')
  for (const field of textFields) if (typeof input[field] !== 'string' || input[field].trim().length < 2 || input[field].length > 120) throw badRequest(`Invalid ${field}.`)
  if (input.email.trim().toLowerCase() !== user.email?.toLowerCase()) throw badRequest('Order email must match the signed-in account.')
  if (input.userId !== user.uid) throw badRequest('Invalid customer identity.')
  if (!/^\+?[0-9 ()-]{8,18}$/.test(input.phone)) throw badRequest('Invalid WhatsApp number.')
  const plan = plans[input.plan]
  if (!plan || input.amount !== plan.amount || input.planName !== plan.name) throw badRequest('Invalid plan or amount.')
  if (!isOwnedStoragePath(input.hudScreenshot, input, user) || !isOwnedStoragePath(input.sensiScreenshot, input, user)) throw badRequest('Invalid screenshot ownership.')
  return {
    customerName: input.customerName.trim(), email: input.email.trim().toLowerCase(), phone: input.phone.trim(),
    deviceName: input.deviceName.trim(), deviceModel: input.deviceModel.trim(), ram: input.ram.trim(), androidVersion: input.androidVersion.trim(),
    gameName: input.gameName.trim(), gameUid: String(input.gameUid || '').trim().slice(0, 120), plan: input.plan, planName: plan.name, amount: plan.amount,
    userId: user.uid, draftId: String(input.draftId), hudScreenshotUrl: input.hudScreenshot, sensiScreenshotUrl: input.sensiScreenshot,
  }
}

export function badRequest(message) { return Object.assign(new Error(message), { statusCode: 400 }) }
function isOwnedStoragePath(value, input, user) { return typeof value === 'string' && value.startsWith(`order-uploads/${user.uid}/${input.draftId}/`) && value.length < 500 }
