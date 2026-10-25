/** Pure helpers shared by the project planner and its regression tests. */
export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
}

export function filterProjects(projects, category = 'all', query = '') {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return projects.filter(project => {
    const text = [project.title, project.subtitle, project.location, project.stoneType,
      ...(project.tags || [])].join(' ').toLocaleLowerCase();
    return (category === 'all' || project.category === category) &&
      terms.every(term => text.includes(term));
  });
}

export function validateReferenceFile(file) {
  if (!file) return 'Choose a reference file.';
  if (!/\.(pdf|dwg|dxf|jpe?g|png)$/i.test(file.name)) {
    return 'Choose a PDF, DWG, DXF, JPG or PNG file.';
  }
  if (file.size > 50 * 1024 * 1024) return 'The reference must be 50 MB or smaller.';
  if (file.size === 0) return 'The selected file is empty.';
  return '';
}

export function validateWizard(wizard, step = wizard.currentStep) {
  if (step === 1 && !wizard.category) return 'Please choose a project category.';
  if (step === 4 && (!wizard.footprint || !wizard.stone)) {
    return 'Please choose an approximate size and material preference.';
  }
  if (step === 5 && !wizard.services.length) return 'Select at least one service to continue.';
  if (step === 6) {
    if (wizard.patronName.trim().length < 2) return 'Please enter your name (at least 2 characters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wizard.email.trim())) return 'Please enter a valid email address.';
    const digits = wizard.phone.replace(/\D/g, '');
    if (!/^[+\d\s().-]+$/.test(wizard.phone) || digits.length < 7 || digits.length > 15) {
      return 'Please enter a valid phone number with 7–15 digits.';
    }
  }
  return '';
}

export function briefEntries(wizard) {
  return [
    ['Project category', wizard.category],
    ['Project location', wizard.location || 'To be decided'],
    ['Approximate site size', wizard.acreage || 'To be decided'],
    ['Style or tradition', wizard.style || 'To be decided'],
    ['Deity or key feature', wizard.deity || 'To be decided'],
    ['Approximate built size', wizard.footprint],
    ['Material preference', wizard.stone],
    ['Services', wizard.services.join('\n')],
    ['Patron name', wizard.patronName],
    ['Trust / foundation', wizard.trustName || 'Not specified'],
    ['Email', wizard.email],
    ['Phone', wizard.phone],
    ['Vision / requirements', wizard.notes || 'Not specified'],
    ['Reference filename (not uploaded)', wizard.uploadedFileName || 'None selected']
  ];
}

export function createBriefText(wizard, referenceId = '') {
  return [
    'SRI AKIL — PROJECT BRIEF',
    referenceId ? `Reference: ${referenceId}` : 'Reference: not yet filed',
    referenceId ? 'Submitted to the studio desk by email and WhatsApp.' : 'Prepared in the project planner.',
    '',
    ...briefEntries(wizard).map(([label, value]) => `${label}\n${value}\n`),
    'Reference files are not included in this document. Share them separately with the studio.'
  ].join('\n');
}