import nodemailer from 'nodemailer'

function mailer() {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM']
  if (required.some((key) => !process.env[key])) throw new Error('SMTP is not configured.')
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
}

function shell(title, content) { return `<!doctype html><html><body style="margin:0;background:#070a12;color:#dbeafe;font-family:Arial,sans-serif"><div style="max-width:600px;margin:auto;padding:32px"><div style="font-size:22px;font-weight:800;color:#22d3ee">SENSI STORE</div><div style="margin-top:24px;padding:28px;background:#0d1321;border:1px solid #1e293b;border-radius:16px"><h1 style="margin:0 0 16px;color:#fff;font-size:26px">${title}</h1>${content}</div><p style="font-size:12px;color:#64748b;margin-top:20px">Need help? Reply to this email and include your Order ID.</p></div></body></html>` }

export async function sendConfirmation(order) {
  return mailer().sendMail({ from: process.env.EMAIL_FROM, to: order.email, subject: `Order confirmed: ${order.orderId}`, html: shell('Payment successful', `<p>Hi ${escapeHtml(order.customerName)},</p><p>Your <strong>${escapeHtml(order.planName)}</strong> order is confirmed.</p><p><strong>Order ID:</strong> ${escapeHtml(order.orderId)}<br><strong>Delivery:</strong> Within 24 hours by email</p>`) })
}

export async function sendDelivered(order) {
  return mailer().sendMail({ from: process.env.EMAIL_FROM, to: order.email, subject: `Your Sensi Store order is delivered: ${order.orderId}`, html: shell('Your setup is ready', `<p>Hi ${escapeHtml(order.customerName)},</p><p>Your <strong>${escapeHtml(order.planName)}</strong> order has been marked delivered. Your custom setup is included with this delivery message or has been sent separately by our team.</p><p><strong>Order ID:</strong> ${escapeHtml(order.orderId)}</p>`) })
}

export async function sendContactMessage(message) {
  return mailer().sendMail({ from: process.env.EMAIL_FROM, replyTo: message.email, to: process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM, subject: `Sensi Store contact: ${message.name}`, text: `From: ${message.name} <${message.email}>\n\n${message.message}` })
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])) }
