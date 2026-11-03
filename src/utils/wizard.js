import { servicesData } from '../data/servicesData.js';
import { escapeHtml as esc, validateWizard, validateReferenceFile, briefEntries, createBriefText } from './planner.js';
import { createReferenceId, notificationLinks, sendAutomaticNotification, whatsappFallbackLinks, openWhatsappChat } from './notify.js';

const categories = [
  ['New temple', 'Plan a new temple or community place of worship.'],
  ['Family shrine', 'Create a smaller place for family prayer.'],
  ['Temple gateway', 'Plan an entrance or gateway for an existing temple.'],
  ['Hall or mandapam', 'Create a space for gatherings, ceremonies or prayer.'],
  ['Temple repair', 'Discuss repairs or improvements to an existing temple.']
];
/** Services the planner deliberately keeps out of its step 5 shortlist. */
const plannerExcludedServices = ['Project coordination'];
const plannerServices = () => servicesData.filter(service => !plannerExcludedServices.includes(service.title));
const footprints = ['Under 5,000 sq.ft (Private / Compact Shrine)', '5,000 – 15,000 sq.ft (Medium Community Sanctuary)',
  '15,000 – 40,000 sq.ft (Monumental Temple Complex)', 'Over 40,000 sq.ft (Grand Regional Pilgrimage Sanctuary)'];
const stones = [
  ['Black granite', 'A traditional option for carved stonework.'],
  ['Warm sandstone', 'A warmer colour for selected design details.'],
  ['Grey granite', 'A quieter tone for pillars and other elements.']
];
const stepNames = ['Project', 'Site', 'Preferences', 'Materials', 'Support', 'Your details'];
const defaults = () => ({
  currentStep: 1, category: categories[0][0], location: '', acreage: '',
  style: '', deity: '', footprint: footprints[0], stone: stones[0][0],
  services: [plannerServices()[0].title], patronName: '', trustName: '', email: '', phone: '', notes: '', uploadedFileName: ''
});

export function createWizard(view) {
  // Personal information is kept in memory only; it leaves the page only when the brief is submitted.
  let draft = defaults();
  let submitted = false;
  let referenceId = '';
  let referenceFile = null;
  let notification = null;
  let handedOff = [];
  let error = '';

  const field = (key, label, placeholder = '', type = 'text', required = false) => `
    <div class="form-group">
      <label class="form-label" for="wizard-${key}">${label}${required ? ' *' : ''}</label>
      <input class="form-input" id="wizard-${key}" name="${key}" type="${type}"
        value="${esc(draft[key])}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''}
        maxlength="${key === 'email' ? 254 : 200}" ${key === 'phone' ? 'autocomplete="tel"' : ''}
        ${key === 'email' ? 'autocomplete="email"' : ''} ${key === 'patronName' ? 'autocomplete="name"' : ''}>
    </div>`;
  const select = (key, label, options) => `
    <div class="form-group"><label class="form-label" for="wizard-${key}">${label}</label>
      <select class="form-select" id="wizard-${key}" name="${key}">
        ${options.map(value => `<option value="${esc(value)}" ${draft[key] === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}
      </select>
    </div>`;
  const choices = (key, options, multiple = false) => `
    <div class="options-grid" role="group" aria-label="${key}">
      ${options.map(([title, description]) => {
        const selected = multiple ? draft[key].includes(title) : draft[key] === title;
        return `<button type="button" class="option-card ${selected ? 'selected' : ''}" data-choice="${key}"
          data-value="${esc(title)}" aria-pressed="${selected}">
          <h4>${esc(title)} ${selected ? '✓' : ''}</h4><p>${esc(description)}</p></button>`;
      }).join('')}
    </div>`;

  function stepContent() {
    switch (draft.currentStep) {
      case 1: return `<h3>What are you planning?</h3><p>Choose the closest option. You can explain more later.</p>${choices('category', categories)}`;
      case 2: return `<h3>Where is the project?</h3><p>Add the location or approximate site size if you know it. You can skip either for now.</p>
        ${field('location', 'Project location', 'e.g. Thanjavur, Tamil Nadu, India')}
        ${field('acreage', 'Approximate site size (optional)', 'e.g. 2.5 acres or 120 × 180 feet')}`;
      case 3: return `<h3>Any traditions or details to keep in mind?</h3><p>Share a style, deity or design preference if you have one. It is okay if you are still deciding.</p>
        ${field('style', 'Temple style or tradition (optional)', 'Describe what you like, or leave this blank')}
        ${field('deity', 'Deity or important feature (optional)', 'Add a name or detail if you know it')}`;
      case 4: return `<h3>Size and materials</h3><p>Choose an estimate if you can. These preferences can be discussed and changed later.</p>
        ${select('footprint', 'Approximate built size', footprints)}
        <p class="form-label">Is there a material you like?</p>${choices('stone', stones)}`;
      case 5: return `<h3>What would you like help with?</h3><p>Choose one or more options. We can discuss the details later.</p>
        ${choices('services', plannerServices().map(s => [s.title, s.subtitle]), true)}`;
      case 6: return `<h3>How can we get back to you?</h3>
        <p>Review the details, then submit. We will prepare an email and WhatsApp hand-off for you to send. Refreshing clears this draft.</p>
        <div class="form-row">${field('patronName', 'Your name', 'Your full name', 'text', true)}
          ${field('trustName', 'Trust / foundation', 'Optional')}</div>
        <div class="form-row">${field('email', 'Email address', 'you@example.com', 'email', true)}
          ${field('phone', 'Phone / WhatsApp', '+91 ...', 'tel', true)}</div>
        <div class="form-group">        <label class="form-label" for="wizard-notes">Anything else you would like us to know?</label>
          <textarea id="wizard-notes" name="notes" class="form-textarea" maxlength="5000"
            placeholder="Share any ideas, questions or details you already have.">${esc(draft.notes)}</textarea></div>
        <div class="form-group">
          <label class="form-label" for="reference-file">Optional reference file</label>
          <div class="file-dropzone" id="reference-dropzone">
            <div class="dropzone-icon" aria-hidden="true">⇪</div>
            <strong>Choose a file or drop it here</strong>
            <p>PDF, DWG, DXF, JPG or PNG · up to 50 MB</p>
            <input type="file" id="reference-file" accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png">
            <p id="reference-status" role="status">${esc(draft.uploadedFileName || 'No reference selected.')}</p>
            ${referenceFile ? '<button class="btn btn-ghost" type="button" id="remove-reference">Remove reference</button>' : ''}
          </div>
          <p class="form-notice">Your file is not uploaded. Only its name is added to the brief; share the actual file separately.</p>
        </div>`;
      default: return '';
    }
  }

  function summary() {
    return briefEntries(draft).slice(0, 8).map(([label, value]) => `
      <div class="summary-item"><small>${esc(label)}</small><span>${esc(value || 'To be decided')}</span></div>`).join('');
  }

  function saveFields() {
    const form = view.querySelector('#wizard-form');
    if (!form) return;
    new FormData(form).forEach((value, key) => {
      if (Object.hasOwn(draft, key) && typeof value === 'string') draft[key] = value;
    });
    const summaryView = view.querySelector('#wizard-summary');
    if (summaryView) summaryView.innerHTML = summary();
  }

  function setError(message) {
    error = message;
    const el = view.querySelector('#wizard-error');
    if (el) {
      el.textContent = message;
      el.hidden = !message;
      if (message) el.focus({ preventScroll: true });
    }
  }

  function goTo(step) {
    saveFields();
    if (step > draft.currentStep) {
      const message = validateWizard(draft);
      if (message) return setError(message);
      if (!view.querySelector('#wizard-form').reportValidity()) return;
    }
    draft.currentStep = Math.max(1, Math.min(6, step));
    error = '';
    render();
    view.querySelector('#wizard-step-title').focus({ preventScroll: true });
    view.querySelector('.wizard-main-panel').scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  function chooseFile(file) {
    const message = validateReferenceFile(file);
    if (message) {
      setError(message);
      view.querySelector('#reference-file').value = '';
      return;
    }
    saveFields();
    referenceFile = file;
    draft.uploadedFileName = file.name;
    error = '';
    render();
    view.querySelector('#reference-file').focus({ preventScroll: true });
  }

  function render() {
    if (submitted) return renderReview();
    view.innerHTML = `
      <section class="section-spacing page-section">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">Your vision, thoughtfully planned</span>
            <h1>Tell us about your temple project.</h1>
            <p class="lead">A few simple questions help us understand your idea. Skip anything you have not decided yet.</p>
          </div>
          <div class="wizard-container">
            <div class="wizard-main-panel">
              <div class="wizard-progress-bar-container">
                <div class="wizard-steps-indicator">
                  ${stepNames.map((name, i) => `<button type="button" data-step="${i + 1}"
                    class="wizard-step-node ${i + 1 === draft.currentStep ? 'active' : ''} ${i + 1 < draft.currentStep ? 'completed' : ''}"
                    ${i + 1 > draft.currentStep + 1 ? 'disabled' : ''}
                    ${i + 1 === draft.currentStep ? 'aria-current="step"' : ''} aria-label="Step ${i + 1}: ${name}">
                    <span class="wizard-step-circle">${i + 1 < draft.currentStep ? '✓' : i + 1}</span><span>${name}</span>
                  </button>`).join('')}
                </div>
                <div class="progress-track" role="progressbar" aria-valuemin="1" aria-valuemax="6" aria-valuenow="${draft.currentStep}" aria-label="Project planner progress">
                  <div class="progress-fill" style="width:${draft.currentStep / 6 * 100}%"></div>
                </div>
              </div>
              <div id="wizard-step-title" tabindex="-1"><span class="section-tag">Step ${draft.currentStep} of 6 · ${stepNames[draft.currentStep - 1]}</span></div>
              <form id="wizard-form" novalidate>
                ${stepContent()}
                <p id="wizard-error" class="form-error" role="alert" tabindex="-1" ${error ? '' : 'hidden'}>${esc(error)}</p>
                <div class="wizard-nav-actions">
                  ${draft.currentStep > 1 ? '<button type="button" class="btn btn-outline-gold" id="wizard-prev">← Previous</button>' : '<span></span>'}
                  <button class="btn btn-gold" type="submit">${draft.currentStep === 6 ? 'Submit my project brief' : 'Continue'} →</button>
                </div>
              </form>
            </div>
            <aside class="wizard-summary-panel" aria-label="Live project summary">
              <div class="summary-heading"><h4>Your project at a glance</h4></div>
              <div id="wizard-summary">${summary()}</div>
              <p class="form-notice">A planning brief, not a quote. Your details reach the studio desk only when you submit this planner.</p>
            </aside>
          </div>
        </div>
      </section>`;
    const form = view.querySelector('#wizard-form');
    form.addEventListener('input', saveFields);
    form.addEventListener('change', saveFields);
    form.addEventListener('submit', event => {
      event.preventDefault();
      saveFields();
      if (draft.currentStep < 6) return goTo(draft.currentStep + 1);
      for (let step = 1; step <= 6; step++) {
        const message = validateWizard(draft, step);
        if (message) {
          draft.currentStep = step;
          error = message;
          render();
          return setError(message);
        }
      }
      submitBrief();
      view.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
    view.querySelector('#wizard-prev')?.addEventListener('click', () => goTo(draft.currentStep - 1));
    view.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => goTo(Number(button.dataset.step))));
    view.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
      saveFields();
      const { choice, value } = button.dataset;
      if (choice === 'services') {
        draft.services = draft.services.includes(value) ? draft.services.filter(s => s !== value) : [...draft.services, value];
      } else draft[choice] = value;
      error = '';
      const index = [...view.querySelectorAll('[data-choice]')].indexOf(button);
      render();
      view.querySelectorAll('[data-choice]')[index]?.focus({ preventScroll: true });
    }));
    const fileInput = view.querySelector('#reference-file');
    const dropzone = view.querySelector('#reference-dropzone');
    fileInput?.addEventListener('change', () => { if (fileInput.files[0]) chooseFile(fileInput.files[0]); });
    dropzone?.addEventListener('dragover', event => { event.preventDefault(); dropzone.classList.add('dragging'); });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
    dropzone?.addEventListener('drop', event => {
      event.preventDefault();
      dropzone.classList.remove('dragging');
      if (event.dataTransfer.files.length !== 1) return setError('Choose one reference file at a time.');
      chooseFile(event.dataTransfer.files[0]);
    });
    view.querySelector('#remove-reference')?.addEventListener('click', () => {
      saveFields(); referenceFile = null; draft.uploadedFileName = ''; render();
    });
  }

  /** Hands the brief out on submit — silent API channels plus, for every number
   *  that is not activated yet, a ready-to-send WhatsApp chat — then reports back. */
  function submitBrief() {
    if (!referenceId) referenceId = createReferenceId();
    notification = notificationLinks(draft, referenceId);
    submitted = true;
    error = '';
    // Opened inside the submit gesture so browsers allow the WhatsApp tab.
    handedOff = whatsappFallbackLinks(draft, referenceId);
    handedOff.forEach(entry => openWhatsappChat(entry.href));
    renderReview();
    const sentId = referenceId;
    sendAutomaticNotification(draft, sentId).then(result => showDeliveryResult(sentId, result));
  }

  const statusText = {
    sending: 'Sending…',
    sent: 'Sent automatically ✓',
    failed: 'Could not send automatically — use the link',
    manual: 'Not switched on yet — use the link',
    handoff: 'WhatsApp opened — press send'
  };

  /** Paints the delivery outcome in place, so the review screen never jumps. */
  function showDeliveryResult(sentId, result) {
    if (!submitted || sentId !== referenceId) return;
    const channels = [
      ['email', result.email, 'email'],
      ...result.whatsapp.map(entry => [entry.number, entry.status, 'whatsapp'])
    ];
    channels.forEach(([key, status, kind]) => {
      const badge = view.querySelector(`#delivery-status-${key}`);
      if (!badge) return;
      const handoff = kind === 'whatsapp' && status === 'manual' && handedOff.some(entry => entry.number === key);
      badge.textContent = handoff ? statusText.handoff : (statusText[status] || statusText.failed);
      badge.dataset.status = status;
    });
    const summary = view.querySelector('#brief-reference');
    if (!summary) return;
    summary.innerHTML = channels.every(([, status]) => status === 'sent')
      ? `<strong>Reference ${esc(referenceId)}.</strong> Your brief was sent automatically to the studio email and WhatsApp desk — nothing more to do. Download or print a copy for your records.`
      : `<strong>Reference ${esc(referenceId)}.</strong> Your brief is ready, but not every studio channel could be reached automatically. Use the links below to send it to the remaining owner contacts.`;
  }

  function renderReview() {
    const channels = notification || notificationLinks(draft, referenceId);
    view.innerHTML = `<section class="section-spacing page-section">
      <div class="container" style="max-width:960px">
        <div class="confirmation-card">
          <span class="section-tag">Brief submitted</span>
          <h1>Your vision.<br>A considered beginning.</h1>
          <p class="lead">Your project brief has been filed with the studio desk.</p>
          <p class="form-notice" id="brief-reference"><strong>Reference ${esc(referenceId)}.</strong> Sending your brief to the studio automatically…</p>
          <ul class="submission-channels">
            <li><small>Email</small><a id="${channels.email.id}" href="${esc(channels.email.href)}">${esc(channels.email.label)}</a>
              <em class="delivery-status" id="delivery-status-email">${statusText.sending}</em></li>
            ${channels.whatsapp.map(entry => `<li><small>WhatsApp</small><a id="${entry.id}" href="${esc(entry.href)}">${esc(entry.label)}</a>
              <em class="delivery-status" id="delivery-status-${entry.number}">${statusText.sending}</em></li>`).join('')}
          </ul>
          <dl class="brief-review">${briefEntries(draft).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
          <div class="brief-actions">
            <button type="button" id="download-brief" class="btn btn-gold">Download brief ↓</button>
            <button type="button" id="print-brief" class="btn btn-outline-gold">Print / Save PDF</button>
            <button type="button" id="edit-brief" class="btn btn-outline-gold">Edit details</button>
            <button type="button" id="reset-brief" class="btn btn-ghost">Clear & start again</button>
          </div>
        </div>
      </div></section>`;
    view.querySelector('#download-brief').addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([createBriefText(draft, referenceId)], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'sri-akil-project-brief.txt'; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    view.querySelector('#print-brief').addEventListener('click', () => window.print());
    view.querySelector('#edit-brief').addEventListener('click', () => { submitted = false; render(); });
    view.querySelector('#reset-brief').addEventListener('click', () => {
      if (!window.confirm('Clear this project brief and all entered details?')) return;
      draft = defaults(); submitted = false; referenceId = ''; notification = null;
      handedOff = []; referenceFile = null; error = ''; render();
    });
  }

  return {
    render,
    save: saveFields,
    selectService(title) {
      if (!servicesData.some(service => service.title === title)) return;
      saveFields();
      if (!draft.services.includes(title)) draft.services.push(title);
      submitted = false;
    }
  };
}