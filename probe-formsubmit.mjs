import { chromium } from 'playwright';

const endpoint = 'https://formsubmit.co/ajax/probecheck2026@example.com';
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
await page.goto('https://example.com');

const json = await page.evaluate(async url => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: 'probe json', message: 'probe', _captcha: 'false' })
    });
    return { ok: response.ok, status: response.status, body: (await response.text()).slice(0, 300) };
  } catch (error) {
    return { error: String(error) };
  }
}, endpoint);

const multipart = await page.evaluate(async url => {
  try {
    const form = new FormData();
    form.append('_subject', 'probe multipart pdf');
    form.append('message', 'probe with attachment');
    form.append('_captcha', 'false');
    form.append('attachment', new File([new Blob(['%PDF-1.4 probe %%EOF'])], 'probe.pdf', { type: 'application/pdf' }));
    const response = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, body: form });
    return { ok: response.ok, status: response.status, body: (await response.text()).slice(0, 300) };
  } catch (error) {
    return { error: String(error) };
  }
}, endpoint);

console.log('JSON  ->', JSON.stringify(json));
console.log('MULTI ->', JSON.stringify(multipart));
await browser.close();
