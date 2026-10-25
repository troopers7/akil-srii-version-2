import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const routes = ['home', 'projects', 'project-detail', 'services', 'temple-design', 'about', 'process', 'insights', 'contact', 'start-project'];

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`all routes render without page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of routes) {
      await page.goto(`/#${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main h1')).toHaveCount(1);
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        heading: document.querySelector('main h1').getBoundingClientRect().top,
        header: document.querySelector('header').getBoundingClientRect().bottom
      }));
      expect(dimensions.scroll, route).toBeLessThanOrEqual(dimensions.width + 1);
      expect(dimensions.heading, route).toBeGreaterThanOrEqual(dimensions.header);
    }
    expect(errors).toEqual([]);
  });
}

test('search retains focus; case study survives reload and browser back', async ({ page }) => {
  await page.goto('/#projects');
  const search = page.locator('#project-search-input');
  await search.fill('no-such-project');
  await expect(search).toBeFocused();
  await expect(page.locator('#projects-empty')).toBeVisible();
  await page.locator('#btn-reset-filters').click();
  await expect(search).toHaveValue('');
  const card = page.locator('.project-card:visible').nth(1);
  const title = await card.locator('h3').innerText();
  await card.click();
  await expect(page).toHaveURL(/project-detail\?id=/);
  await expect(page.locator('main h1')).toHaveText(title);
  await page.reload();
  await expect(page.locator('main h1')).toHaveText(title);
  await page.goBack();
  await expect(search).toBeVisible();
});

test('home highlights switch images and keep the selected pagination state', async ({ page }) => {
  await page.goto('/#home');
  const image = page.locator('#home-slider-image');
  await expect(image).toHaveAttribute('src', '/assets/hero_temple.jpg');
  await page.getByRole('button', { name: 'Next highlight' }).click();
  await expect(image).toHaveAttribute('src', '/assets/gopuram_monolith.jpg');
  await expect(page.locator('.home-slider-dot').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Show highlight 3' }).click();
  await expect(image).toHaveAttribute('src', '/assets/mandapam_hall.jpg');
  await expect(page.locator('main h1')).toContainText('Architecture that');
});

test('mobile menu and article dialog support keyboard dismissal and focus return', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#home');
  const toggle = page.locator('#mobile-menu-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.locator('.mobile-nav-link[data-page="insights"]').click();
  const article = page.locator('.insight-card').first();
  await article.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#modal-close-insight')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#insight-reader-modal a')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(article).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/overlay-open/);
});

for (const width of [390, 1440]) {
  test(`planner submits to every studio owner and exports at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    // The delivery services are stubbed so the test can assert the outgoing payload.
    const deliveries = [];
    const popups = [];
    await page.route('https://formsubmit.co/**', route => {
      deliveries.push(route.request());
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: 'true' }) });
    });
    await page.route('https://api.callmebot.com/**', route => {
      deliveries.push(route.request());
      return route.fulfill({ status: 200, contentType: 'text/plain', body: 'OK' });
    });
    // The WhatsApp hand-off tab is served locally instead of really opening wa.me.
    await context.route('https://wa.me/**', route => route.fulfill({
      status: 200, contentType: 'text/html', body: '<html><body>WhatsApp</body></html>'
    }));
    page.on('popup', popup => popups.push(popup));
    await page.goto('/#start-project');
    await expect(page.locator('[data-choice="category"]')).toHaveCount(5);
    await expect(page.locator('#wizard-form')).not.toContainText('Agama Master Planning Only');
    const next = () => page.locator('#wizard-form button[type="submit"]').click();
    await next();
    await expect(page.locator('#wizard-location')).toBeVisible();
    await page.locator('#wizard-location').fill('Thanjavur, Tamil Nadu');
    await page.locator('#wizard-acreage').fill('3 acres');
    await next();
    await expect(page.locator('select#wizard-location')).toHaveCount(0);
    await page.locator('#wizard-prev').click();
    await expect(page.locator('#wizard-acreage')).toHaveValue('3 acres');
    await next();
    await page.evaluate(() => { location.hash = 'about'; });
    await expect(page.locator('.about-hero-grid')).toBeVisible();
    await page.evaluate(() => { location.hash = 'start-project'; });
    await page.locator('#wizard-prev').click();
    await expect(page.locator('#wizard-acreage')).toHaveValue('3 acres');
    await next();
    await expect(page.locator('select#wizard-style')).toHaveCount(0);
    await page.locator('#wizard-style').fill('Imperial Chola');
    await page.locator('#wizard-deity').fill('Lord Shiva');
    await next();
    await expect(page.locator('[data-choice="stone"]')).toHaveCount(3);
    await expect(page.locator('#wizard-form')).not.toContainText('White Teak Marble');
    await page.locator('#wizard-footprint').selectOption({ index: 2 });
    await page.locator('[data-choice="stone"]').nth(1).click();
    await expect(page.locator('#wizard-footprint')).toHaveValue(/15,000 – 40,000/);
    await next();
    await expect(page.locator('#wizard-form')).not.toContainText('Turnkey Consecration Execution');
    await page.locator('[data-choice="services"][aria-pressed="true"]').click();
    await next();
    await expect(page.locator('#wizard-error')).toContainText('at least one');
    await page.locator('[data-choice="services"]').first().click();
    await next();
    await page.locator('#wizard-patronName').fill('Akil Kumar');
    await page.locator('#wizard-email').fill('akil@example.com');
    await page.locator('#wizard-phone').fill('123');
    await next();
    await expect(page.locator('#wizard-error')).toContainText('phone');
    await page.locator('#wizard-phone').fill('+91 98765 43210');
    await page.locator('#wizard-notes').fill('Courtyard & carved lotus details.');
    await page.locator('#reference-file').setInputFiles({
      name: 'survey.pdf', mimeType: 'application/pdf', buffer: Buffer.from('Sample reference')
    });
    await expect(page.locator('#wizard-patronName')).toHaveValue('Akil Kumar');
    await next();
    await expect(page.locator('#brief-reference')).toContainText(/SRI-\d{8}-\d{4}/);
    await expect(page.locator('.brief-review')).toContainText('3 acres');
    await expect(page.locator('.brief-review')).toContainText('survey.pdf');
    await expect(page.locator('#print-brief')).toBeVisible();
    // The email channel is pushed silently to formsubmit.co with both owners and the whole brief.
    await expect(page.locator('#delivery-status-email')).toHaveText('Sent automatically ✓');
    await expect(page.locator('#delivery-status-email')).toHaveAttribute('data-status', 'sent');
    expect(deliveries.some(request => request.url().includes('formsubmit.co'))).toBe(true);
    const emailRequest = deliveries.find(request => request.url().includes('formsubmit.co'));
    expect(emailRequest.method()).toBe('POST');
    const payload = JSON.parse(emailRequest.postData());
    expect(payload._cc).toBe('gayathriakilan17@gmail.com');
    expect(payload._subject).toContain('New project enquiry');
    expect(payload._replyto).toBe('akil@example.com');
    expect(payload['Project location']).toBe('Thanjavur, Tamil Nadu');
    expect(payload['Approximate site size']).toBe('3 acres');
    expect(payload['Full brief']).toContain('Courtyard & carved lotus details.');
    expect(payload['Full brief']).toContain('Submitted to the studio desk by email and WhatsApp.');
    // WhatsApp depends on the one-time callmebot apikeys; the manual link always stays available.
    const whatsappStatuses = await page.locator('.delivery-status[id^="delivery-status-9"]')
      .evaluateAll(nodes => nodes.map(node => node.dataset.status));
    expect(whatsappStatuses.length).toBe(2);
    expect(whatsappStatuses.every(status => ['sent', 'manual'].includes(status))).toBe(true);
    for (const number of ['919790224561', '919940295932']) {
      await expect(page.locator(`#notify-whatsapp-${number}`)).toHaveAttribute('href', new RegExp(`^https://wa\\.me/${number}\\?text=`));
    }
    await expect(page.locator('#notify-email')).toHaveAttribute('href', /^mailto:akilanmaneesha@gmail\.com,gayathriakilan17@gmail\.com\?subject=/);
    await expect(page.locator('#brief-reference')).toContainText(whatsappStatuses.every(status => status === 'sent')
      ? 'sent automatically to the studio email and WhatsApp desk'
      : 'not every studio channel could be reached automatically');
    // Every number without a callmebot apikey gets a ready-to-send WhatsApp chat;
    // nothing else opens and the visitor stays on the review screen.
    const expectedHandoffs = whatsappStatuses.filter(status => status === 'manual').length;
    await expect.poll(() => popups.length).toBe(expectedHandoffs);
    for (const popup of popups) expect(popup.url()).toContain('wa.me/');
    if (expectedHandoffs) {
      await expect(page.locator('#delivery-status-919790224561')).toHaveText('WhatsApp opened — press send');
      await expect.poll(() => popups[0].url()).toContain('wa.me/');
      const chat = new URL(popups[0].url()).searchParams.get('text');
      expect(chat).toContain('*New Enquiry — Sri Akil*');
      expect(chat).toContain('*Approximate site size:* 3 acres');
      expect(chat).toContain('*Patron name:* Akil Kumar');
    }
    await expect(page).toHaveURL(/start-project/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#download-brief').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sri-akil-project-brief.txt');
    const text = await readFile(await download.path(), 'utf8');
    expect(text).toContain('Submitted to the studio desk by email and WhatsApp.');
    expect(text).toContain('Courtyard & carved lotus details.');
    await page.locator('#edit-brief').click();
    await expect(page.locator('#wizard-patronName')).toHaveValue('Akil Kumar');
    await next();
    await expect(page.locator('#brief-reference')).toContainText(/SRI-\d{8}-\d{4}/);
    page.on('dialog', dialog => dialog.accept());
    await page.locator('#reset-brief').click();
    await expect(page.locator('.wizard-step-node[aria-current="step"]')).toContainText('Project');
    await next();
    await expect(page.locator('#wizard-location')).toHaveValue('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('anatomy and process selection preserve keyboard focus', async ({ page }) => {
  await page.goto('/#temple-design');
  const pin = page.locator('[data-anatomy-pin]').first();
  await pin.focus();
  await page.keyboard.press('Enter');
  await expect(pin).toBeFocused();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/#process');
  const stage = page.locator('[data-step-btn]').nth(2);
  await stage.click();
  await expect(stage).toBeFocused();
  await expect(stage).toHaveAttribute('aria-pressed', 'true');
});

test('contact page validates inputs and prepares an inquiry hand-off', async ({ page }) => {
  await page.goto('/#contact');
  await expect(page.locator('main h1')).toHaveText('Tell us what you are planning');
  await page.locator('#btn-submit-contact').click();
  await expect(page.locator('#contact-feedback')).toBeVisible();
  await expect(page.locator('#contact-feedback')).toHaveClass(/error/);

  await page.locator('#contact-name').fill('Sundar Raman');
  await page.locator('#contact-email').fill('sundar@example.com');
  await page.locator('#contact-phone').fill('+91 98400 12345');
  await page.locator('#contact-message').fill('Seeking Agama advisory for a monolithic Krishna granite Vimana on a 5-acre property.');
  await page.locator('#btn-submit-contact').click();

  await expect(page.locator('#contact-feedback')).toBeVisible();
  await expect(page.locator('#contact-feedback')).toHaveClass(/prepared/);
  await expect(page.locator('#contact-feedback')).toContainText('This page has not sent your message');
  await expect(page.locator('#contact-feedback a[href^="mailto:"]')).toBeVisible();
  await expect(page.locator('#contact-feedback a[href^="https://wa.me/"]')).toBeVisible();
  const emailLink = await page.locator('#contact-feedback a[href^="mailto:"]').getAttribute('href');
  expect(decodeURIComponent(emailLink)).toContain('Sundar Raman');
  expect(decodeURIComponent(emailLink)).toContain('Seeking Agama advisory');
});