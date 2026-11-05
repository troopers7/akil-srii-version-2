/**
 * Automatic delivery of a submitted project brief to the studio owners.
 *
 * A browser page cannot reach an SMTP server or WhatsApp by itself, so the
 * submit step pushes the brief to two services that need no backend:
 *
 *   • Email    — formsubmit.co (no account needed). The very first submission
 *                emails a one-time confirmation link to the owner address;
 *                once that link is clicked every later submission is delivered
 *                silently, with the second owner address on the CC line.
 *   • WhatsApp — callmebot.com. Each owner number once sends the bot the
 *                activation message ("I allow callmebot to send me messages" to
 *                +34 623 78 95 80) and pastes the APIKEY it replies with below.
 *
 * Nothing opens on the visitor's screen. The review screen shows the live
 * result per channel and keeps the manual links as a safety net.
 *
 * Until an owner number has its callmebot apikey, the submit step instead hands
 * the finished brief to that number's WhatsApp chat (WHATSAPP_DEEPLINK_FALLBACK)
 * so the enquiry always leaves the page — exactly like typical studio sites.
 */
import { briefEntries, createBriefText } from './planner.js';

export const OWNER_EMAILS = ['akilanmaneesha@gmail.com', 'gayathriakilan17@gmail.com'];

/** Owner WhatsApp numbers in international format (no "+" or spaces, as wa.me requires). */
export const OWNER_WHATSAPP = [
  { number: '919940295932', display: '+91 99402 95932', apikey: '' },
  { number: '919790224561', display: '+91 97902 24561', apikey: '' }
];

export const EMAIL_DELIVERY = {
  /** The first submission mails the one-time confirmation link to this address. */
  endpoint: `https://formsubmit.co/ajax/${OWNER_EMAILS[0]}`,
  /** After confirming, formsubmit.co shows a random alias (…/ajax/el/ab12cd34).
   *  Paste it here instead so the owner address stays out of the page source. */
  alias: ''
};

/** Mail clients refuse very long mailto bodies, so only the email copy is capped. */
const EMAIL_BODY_LIMIT = 1800;
const SHORTEN_NOTE = '\n\n… shortened for email. Download the full brief for every detail.';
const DELIVERY_TIMEOUT = 10000;

export function createReferenceId(now = new Date()) {
  const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
  return `SRI-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function notificationSubject(wizard, referenceId = '') {
  const deity = wizard.deity.trim() ? ` for ${wizard.deity.trim()}` : '';
  return `${referenceId ? `[${referenceId}] ` : ''}New project enquiry — ${wizard.category}${deity}`;
}

export function truncateMessage(text, limit = Infinity) {
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - SHORTEN_NOTE.length)).trimEnd()}${SHORTEN_NOTE}`;
}

export function notificationMessage(wizard, referenceId = '', limit = Infinity) {
  return truncateMessage(createBriefText(wizard, referenceId), limit);
}

/** Compact WhatsApp text with bold labels, the way studio enquiry sites send it. */
export function whatsappMessage(wizard, referenceId = '') {
  const lines = ['*New Enquiry — Sri Akil*'];
  if (referenceId) lines.push(`*Reference:* ${referenceId}`);
  lines.push('');
  briefEntries(wizard).forEach(([label, value]) => lines.push(`*${label}:* ${value.replace(/\n+/g, ', ')}`));
  return lines.join('\n');
}

/** Flat JSON body handed to formsubmit.co: every brief field plus the full text. */
export function emailPayload(wizard, referenceId = '') {
  return {
    _subject: notificationSubject(wizard, referenceId),
    _cc: OWNER_EMAILS.slice(1).join(','),
    _replyto: wizard.email,
    _template: 'table',
    _captcha: 'false',
    'New enquiry': `A project brief was submitted on the website. Reference ${referenceId}.`,
    ...Object.fromEntries(briefEntries(wizard)),
    'Full brief': notificationMessage(wizard, referenceId)
  };
}

export function whatsappPingUrl(number, apikey, message) {
  return `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(`+${number}`)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`;
}

export function mailtoUrl(wizard, referenceId = '') {
  const subject = encodeURIComponent(notificationSubject(wizard, referenceId));
  const body = encodeURIComponent(notificationMessage(wizard, referenceId, EMAIL_BODY_LIMIT));
  return `mailto:${OWNER_EMAILS.join(',')}?subject=${subject}&body=${body}`;
}

export function whatsappUrl(number, wizard, referenceId = '') {
  return `https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage(wizard, referenceId))}`;
}

/** Every owner channel the submitted brief must reach, in dispatch order. */
export function notificationLinks(wizard, referenceId = '') {
  return {
    email: { id: 'notify-email', label: OWNER_EMAILS.join(', '), href: mailtoUrl(wizard, referenceId) },
    whatsapp: OWNER_WHATSAPP.map(owner => ({
      id: `notify-whatsapp-${owner.number}`,
      label: owner.display,
      number: owner.number,
      href: whatsappUrl(owner.number, wizard, referenceId)
    }))
  };
}

/**
 * When a WhatsApp number has no callmebot apikey yet, the submit step hands the
 * ready-written brief to that number's WhatsApp chat (one extra tap to send),
 * the same way most studio websites do it. Set false for a silent-only setup.
 */
export const WHATSAPP_DEEPLINK_FALLBACK = true;

/** WhatsApp numbers still relying on the deep-link hand-off. */
export function whatsappFallbackLinks(wizard, referenceId = '') {
  if (!WHATSAPP_DEEPLINK_FALLBACK) return [];
  return OWNER_WHATSAPP.filter(owner => !owner.apikey.trim())
    .map(owner => ({ number: owner.number, label: owner.display, href: whatsappUrl(owner.number, wizard, referenceId) }));
}

/** Opens one ready-to-send WhatsApp chat. Running inside the submit gesture keeps
 *  browsers from treating it as a blocked pop-up. */
export function openWhatsappChat(href) {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

/** 'sent' | 'failed' | 'manual' — 'manual' means the channel is not switched on yet. */
export const DELIVERY_STATUS = { sent: 'sent', failed: 'failed', manual: 'manual' };

function abortableFetch(url, options, ms) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => window.clearTimeout(timer));
}

async function deliverEmail(wizard, referenceId) {
  const endpoint = EMAIL_DELIVERY.alias.trim() || EMAIL_DELIVERY.endpoint.trim();
  if (!endpoint) return DELIVERY_STATUS.manual;
  try {
    const response = await abortableFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(emailPayload(wizard, referenceId))
    }, DELIVERY_TIMEOUT);
    if (!response.ok) return DELIVERY_STATUS.failed;
    const payload = await response.json().catch(() => null);
    if (!payload) return DELIVERY_STATUS.sent;
    return String(payload.success) === 'true' ? DELIVERY_STATUS.sent : DELIVERY_STATUS.failed;
  } catch {
    return DELIVERY_STATUS.failed;
  }
}

async function deliverWhatsapp(owner, message) {
  if (!owner.apikey.trim()) return DELIVERY_STATUS.manual;
  try {
    // callmebot answers without CORS headers, so this stays fire-and-forget.
    await abortableFetch(whatsappPingUrl(owner.number, owner.apikey.trim(), message), { mode: 'no-cors' }, DELIVERY_TIMEOUT);
    return DELIVERY_STATUS.sent;
  } catch {
    return DELIVERY_STATUS.failed;
  }
}

/** Sends the brief to every owner channel at once and reports the outcome per channel. */
export async function sendAutomaticNotification(wizard, referenceId = '') {
  const message = whatsappMessage(wizard, referenceId);
  const [email, ...whatsapp] = await Promise.all([
    deliverEmail(wizard, referenceId),
    ...OWNER_WHATSAPP.map(owner => deliverWhatsapp(owner, message))
  ]);
  return {
    email,
    whatsapp: OWNER_WHATSAPP.map((owner, index) => ({ number: owner.number, label: owner.display, status: whatsapp[index] }))
  };
}

/** Flat JSON body handed to formsubmit.co for contact page inquiries. */
export function contactInquiryEmailPayload(inquiry) {
  const subject = `[${inquiry.refId}] New Architectural Project Inquiry: ${inquiry.type} — ${inquiry.name}`;
  return {
    _subject: subject,
    _cc: OWNER_EMAILS.slice(1).join(','),
    _replyto: inquiry.email,
    _template: 'table',
    _captcha: 'false',
    'Application Reference': inquiry.refId,
    'Filing Date': inquiry.filingDate,
    'Patron Name': inquiry.name,
    'Patron Email': inquiry.email,
    'Direct Phone': inquiry.phone,
    'Designated Studio Desk': inquiry.studio,
    'Sanctuary Typology / Intent': inquiry.type,
    'Vision & Land Details': inquiry.message,
    'Architects Notified': OWNER_EMAILS.join(', ')
  };
}

/** Direct mailto client backup link for contact inquiries. */
export function contactMailtoUrl(inquiry) {
  const subject = encodeURIComponent(`[${inquiry.refId}] Architectural Project Inquiry: ${inquiry.type} — ${inquiry.name}`);
  const body = encodeURIComponent([
    'SRI AKIL — ARCHITECTURAL PROJECT INQUIRY DOSSIER',
    `Reference: ${inquiry.refId}`,
    `Filing Date: ${inquiry.filingDate}`,
    '',
    'PATRON DETAILS:',
    `• Patron Name: ${inquiry.name}`,
    `• Email: ${inquiry.email}`,
    `• Phone: ${inquiry.phone}`,
    `• Studio Desk: ${inquiry.studio}`,
    '',
    'ARCHITECTURAL SCOPE & LAND VISION:',
    `• Sanctuary Typology: ${inquiry.type}`,
    '• Project Vision & Land Details:',
    inquiry.message,
    '',
    `Dispatched to Principal Architect Desk (${OWNER_EMAILS.join(', ')}).`,
    'Response timeline: within 24–48 hours.'
  ].join('\n'));
  return `mailto:${OWNER_EMAILS.join(',')}?subject=${subject}&body=${body}`;
}

/** Delivers contact inquiry directly to the architect's email via FormSubmit AJAX. */
export async function deliverContactInquiry(inquiry) {
  const endpoint = EMAIL_DELIVERY.alias.trim() || EMAIL_DELIVERY.endpoint.trim();
  if (!endpoint) return DELIVERY_STATUS.manual;
  try {
    const response = await abortableFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(contactInquiryEmailPayload(inquiry))
    }, DELIVERY_TIMEOUT);
    if (!response.ok) return DELIVERY_STATUS.failed;
    const payload = await response.json().catch(() => null);
    if (!payload) return DELIVERY_STATUS.sent;
    return String(payload.success) === 'true' ? DELIVERY_STATUS.sent : DELIVERY_STATUS.failed;
  } catch {
    return DELIVERY_STATUS.failed;
  }
}

