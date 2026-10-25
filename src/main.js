import { projectsData } from './data/projectsData.js';
import { templeStylesData, templeAnatomyData } from './data/templeDesignData.js';
import { servicesData } from './data/servicesData.js';
import { aboutData } from './data/aboutData.js';
import { processStagesData } from './data/processData.js';
import { insightsData } from './data/insightsData.js';
import { sacredAudio } from './utils/audio.js';
import { escapeHtml, filterProjects } from './utils/planner.js';
import { createWizard } from './utils/wizard.js';

// State Management
const state = {
  activePage: 'home',
  selectedProjectId: projectsData[0].id,
  selectedAnatomyId: templeAnatomyData[1].id, // default to Vimana
  selectedProcessStep: '01',
  projectFilter: 'all',
  searchQuery: '',
};

// Routing & View Controller
const appView = document.getElementById('app-view');
const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
const mobileDrawer = document.getElementById('mobile-nav-drawer');
const mobileToggle = document.getElementById('mobile-menu-toggle');
const audioToggle = document.getElementById('audio-toggle');

const projectWizard = createWizard(appView);
let modalReturnFocus = null;
let routeInitialized = false;
const footer = document.querySelector('.site-footer');
const header = document.getElementById('site-header');
const backToTop = document.getElementById('back-to-top');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => reducedMotion.matches ? 'auto' : 'smooth';

audioToggle.addEventListener('click', async () => {
  try {
    const enabled = await sacredAudio.toggle();
    audioToggle.classList.toggle('playing', enabled);
    audioToggle.setAttribute('aria-pressed', String(enabled));
    audioToggle.title = enabled ? 'Mute Temple Chime' : 'Play Sacred Temple Chime';
  } catch {
    document.getElementById('site-status').textContent = 'Audio is unavailable in this browser.';
  }
});

function syncOverlayState() {
  const menuOpen = mobileDrawer.classList.contains('open');
  const modalOpen = Boolean(document.querySelector('.modal-overlay.open'));
  document.body.classList.toggle('overlay-open', menuOpen || modalOpen);
  appView.inert = menuOpen || modalOpen;
  footer.inert = menuOpen || modalOpen;
  header.inert = modalOpen;
  backToTop.inert = menuOpen || modalOpen;
}

function setMenu(open, restoreFocus = false) {
  mobileDrawer.classList.toggle('open', open);
  mobileDrawer.inert = !open;
  mobileToggle.setAttribute('aria-expanded', String(open));
  mobileToggle.setAttribute('aria-label', open ? 'Close Navigation Menu' : 'Open Navigation Menu');
  syncOverlayState();
  if (open) mobileDrawer.querySelector('a')?.focus();
  else if (restoreFocus) mobileToggle.focus();
}
mobileToggle.addEventListener('click', () => setMenu(!mobileDrawer.classList.contains('open'), true));
mobileDrawer.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false, true);
});
window.matchMedia('(min-width: 1241px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

function closeArticle(restoreFocus = true) {
  const modal = document.getElementById('insight-reader-modal');
  modal.classList.remove('open');
  modal.inert = true;
  syncOverlayState();
  if (restoreFocus && modalReturnFocus?.isConnected) modalReturnFocus.focus();
}

document.addEventListener('keydown', event => {
  const modal = document.querySelector('.modal-overlay.open');
  const menuOpen = mobileDrawer.classList.contains('open');
  if (event.key === 'Escape') {
    if (modal) closeArticle();
    else if (menuOpen) setMenu(false, true);
  }
  if (event.key !== 'Tab' || (!modal && !menuOpen)) return;
  const elements = modal
    ? [...modal.querySelectorAll('a[href], button:not(:disabled), input, [tabindex="0"]')]
    : [mobileToggle, ...mobileDrawer.querySelectorAll('a[href]')];
  const first = elements[0], last = elements.at(-1);
  if (event.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !elements.includes(document.activeElement))) {
    event.preventDefault(); first.focus();
  }
});

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  appView.focus();
  appView.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
});
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
  appView.focus({ preventScroll: true });
});
function updateScrollUI() {
  header.classList.toggle('scrolled', window.scrollY > 40);
  backToTop.hidden = window.scrollY < 650;
}
window.addEventListener('scroll', updateScrollUI, { passive: true });

const pageNames = {
  home: 'Temple Design & Stonework', projects: 'Projects', 'project-detail': 'Project details',
  services: 'Services', 'temple-design': 'Temple design guide', about: 'About Sri Akil',
  process: 'How it works', insights: 'Planning guides', 'start-project': 'Project planner',
  contact: 'Contact Us'
};

// Top Progress Bar Controller
let progressTimer = null;
function startProgressBar() {
  const bar = document.getElementById('page-progress-bar');
  if (!bar) return;
  clearTimeout(progressTimer);
  bar.classList.remove('finish');
  bar.classList.add('start');
}

function completeProgressBar() {
  const bar = document.getElementById('page-progress-bar');
  if (!bar) return;
  bar.classList.remove('start');
  bar.classList.add('finish');
  progressTimer = setTimeout(() => {
    bar.classList.remove('finish');
  }, 400);
}

// Global Button Interaction & Sacred Ripple Animation
function initButtonAnimations() {
  document.addEventListener('pointerdown', event => {
    if (reducedMotion.matches) return;
    const btn = event.target.closest(
      '.btn, button, .nav-link, .mobile-nav-link, .filter-pill, .option-card, .project-card, .timeline-nav-btn, .case-back-link, .wizard-step-node, .anatomy-hotspot-pin'
    );
    if (!btn) return;

    const style = window.getComputedStyle(btn);
    if (style.position === 'static') {
      btn.style.position = 'relative';
    }

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    if (btn.classList.contains('btn-gold') || (btn.classList.contains('filter-pill') && btn.classList.contains('active'))) {
      ripple.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.48) 0%, rgba(239, 225, 201, 0.22) 50%, transparent 75%)';
    } else {
      ripple.style.background = 'radial-gradient(circle, rgba(176, 141, 87, 0.38) 0%, rgba(101, 122, 91, 0.18) 50%, transparent 75%)';
    }

    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 600);
  });
}

function handleRoute() {
  projectWizard.save();
  const [page, query = ''] = window.location.hash.slice(1).split('?');
  state.activePage = Object.hasOwn(pageNames, page) ? page : 'home';
  if (page && !Object.hasOwn(pageNames, page)) history.replaceState(null, '', '#home');
  if (state.activePage === 'project-detail') {
    const id = new URLSearchParams(query).get('id');
    state.selectedProjectId = projectsData.some(project => project.id === id) ? id : projectsData[0].id;
  }
  setMenu(false);
  closeArticle(false);
  navLinks.forEach(link => {
    const active = link.dataset.page === state.activePage;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const doRender = () => {
    renderCurrentPage();
    document.title = `${pageNames[state.activePage]} | Sri Akil`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (routeInitialized) appView.focus({ preventScroll: true });
    routeInitialized = true;
    updateScrollUI();

    // Trigger silky smooth page entrance animation
    if (!reducedMotion.matches) {
      appView.classList.remove('page-enter');
      void appView.offsetWidth;
      appView.classList.add('page-enter');
    }
  };

  startProgressBar();

  if (!reducedMotion.matches && typeof document.startViewTransition === 'function') {
    const transition = document.startViewTransition(() => {
      doRender();
    });
    transition.finished.finally(() => {
      completeProgressBar();
    });
  } else {
    doRender();
    requestAnimationFrame(() => {
      completeProgressBar();
    });
  }
}

initButtonAnimations();

window.addEventListener('hashchange', handleRoute);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', handleRoute);
else handleRoute();

// Render Controller
function renderCurrentPage() {
  switch (state.activePage) {
    case 'home':
      renderHomePage();
      break;
    case 'projects':
      renderProjectsPage();
      break;
    case 'project-detail':
      renderProjectDetailPage();
      break;
    case 'services':
      renderServicesPage();
      break;
    case 'temple-design':
      renderTempleDesignPage();
      break;
    case 'about':
      renderAboutPage();
      break;
    case 'process':
      renderProcessPage();
      break;
    case 'insights':
      renderInsightsPage();
      break;
    case 'contact':
      renderContactPage();
      break;
    case 'start-project':
      projectWizard.render();
      break;
    default:
      renderHomePage();
  }
}

/* ==========================================================================
   PAGE RENDERERS
   ========================================================================== */

/* 1. HOME PAGE */
function renderHomePage() {
  const featuredProject = projectsData[0];
  const heroSlides = [
    {
      image: '/assets/hero_temple.jpg',
      alt: 'Temple tower rising against a warm evening sky',
      eyebrow: 'DESIGNED WITH DEVOTION',
      title: 'Sacred spaces.<br><em>Made with care.</em>',
      description: 'Traditional temple architecture, thoughtful planning and hand-finished stonework for the generations ahead.',
    },
    {
      image: '/assets/gopuram_monolith.jpg',
      alt: 'Carved granite temple gopuram',
      eyebrow: 'CRAFTED IN GRANITE',
      title: 'Heritage in every<br><em>carved detail.</em>',
      description: 'From the first Vastu-aligned plan to the final sculpted ornament, every detail has a purpose.',
    },
    {
      image: '/assets/mandapam_hall.jpg',
      alt: 'Pillared stone mandapam inside a temple',
      eyebrow: 'ROOTED IN TRADITION',
      title: 'Architecture that<br><em>welcomes worship.</em>',
      description: 'Sanctums, mandapams and sacred landscapes shaped around the traditions they serve.',
    },
  ];

  appView.innerHTML = `
    <section class="home-slider" aria-label="Sri Akil temple architecture highlights">
      <img class="home-slider-image" id="home-slider-image" src="${heroSlides[0].image}" alt="${heroSlides[0].alt}" fetchpriority="high">
      <div class="home-slider-shade"></div>
      <div class="home-slider-content" aria-live="polite">
        <span class="home-slider-eyebrow" id="home-slider-eyebrow">${heroSlides[0].eyebrow}</span>
        <h1 class="home-slider-title" id="home-slider-title">${heroSlides[0].title}</h1>
        <p id="home-slider-description">${heroSlides[0].description}</p>
        <div class="home-slider-actions">
          <a href="#projects" class="btn btn-gold">Explore our work <span class="btn-arrow">→</span></a>
          <a href="#start-project" class="home-slider-link">Plan a temple with us</a>
        </div>
      </div>
      <button class="home-slider-arrow home-slider-previous" type="button" aria-label="Previous highlight" data-hero-direction="-1">‹</button>
      <button class="home-slider-arrow home-slider-next" type="button" aria-label="Next highlight" data-hero-direction="1">›</button>
      <div class="home-slider-pagination" role="group" aria-label="Choose a highlight">
        ${heroSlides.map((slide, index) => `<button class="home-slider-dot${index === 0 ? ' active' : ''}" type="button" data-hero-slide="${index}" aria-label="Show highlight ${index + 1}" aria-pressed="${index === 0}"></button>`).join('')}
      </div>
    </section>

    <section class="home-welcome section-spacing">
      <div class="container home-welcome-grid">
        <div class="home-welcome-copy">
          <span class="section-tag">Temple design & stonework</span>
          <h2>Make your temple idea easier to plan.</h2>
          <p class="lead">Start with what matters to you. We can help make the design choices and next steps clearer.</p>
          <p>From a family shrine to a community temple, we guide each commission from its first conversation through design, stonework and construction—with respect for the customs that make every sacred space unique.</p>
          <a href="#about" class="btn btn-gold">Discover our studio <span class="btn-arrow">→</span></a>
        </div>
        <div class="home-welcome-gallery" aria-label="Temple design and craft">
          <figure class="home-welcome-main-image">
            <img src="/assets/sthapathi_craft.jpg" alt="An artisan working on a stone carving" loading="lazy">
            <figcaption>Made by hand, guided by tradition</figcaption>
          </figure>
          <figure class="home-welcome-detail-image">
            <img src="/assets/stone_detail.jpg" alt="Close detail of carved temple stonework" loading="lazy">
          </figure>
          <span class="home-welcome-seal" aria-hidden="true">SRI<br>AKIL</span>
        </div>
      </div>
    </section>

    <!-- Metrics Ticker -->
    <div class="hero-metrics-strip">
      <div class="container">
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-value">01</div>
            <div class="metric-label">Share your idea</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">02</div>
            <div class="metric-label">Explore a design together</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">03</div>
            <div class="metric-label">Plan the next steps</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">04</div>
            <div class="metric-label">Shape your sacred space</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sacred Philosophy & Vastu Geometry -->
    <section class="philosophy-section section-spacing">
      <div class="container">
        <div class="philosophy-grid">
          <div>
            <span class="section-tag">A straightforward approach</span>
            <h2>Traditional temple craft, planned around your needs.</h2>
            <p class="lead">
              Every temple begins with a community, a place and a purpose.
            </p>
            <p>
              We help you explore the right layout, materials and traditional details for your project. From the first conversation through design and stonework, we explain the choices and next steps in clear language.
            </p>
            <div style="margin-top: var(--space-4);">
              <a href="#about" class="btn btn-ghost">
                ABOUT SRI AKIL <span class="btn-arrow">→</span>
              </a>
            </div>
          </div>

          <div class="mandala-visual-card">
            <img src="/assets/temple_blueprint.jpg" alt="Traditional temple plan illustration" class="mandala-img">
            <div class="mandala-caption">
              <span>Traditional planning</span>
              <span>Thoughtful site layout</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Project Spotlight -->
    <section class="section-spacing" style="background: var(--bg-surface);">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Featured project</span>
          <h2>${featuredProject.title}</h2>
          <p>${featuredProject.subtitle} — ${featuredProject.location}, ${featuredProject.year}.</p>
        </div>

        <div class="spotlight-card">
          <div class="spotlight-media">
            <img src="${featuredProject.image}" alt="${featuredProject.title}" class="spotlight-img" style="object-position: center 10%;">
            <span class="spotlight-badge">${featuredProject.status} — ${featuredProject.year}</span>
          </div>
          <div class="spotlight-info">
            <span class="section-tag">${featuredProject.subtitle}</span>
            <h3 style="font-size: 2rem; margin: var(--space-2) 0;">${featuredProject.title}</h3>
            <p style="color: var(--text-ivory-soft);">
              ${featuredProject.chapters.vision.text}
            </p>

            <div class="spotlight-meta-list">
              <div class="spotlight-meta-item">
                <small>Project type</small>
                <span>${featuredProject.footprint}</span>
              </div>
              <div class="spotlight-meta-item">
                <small>Project status</small>
                <span>${featuredProject.status}</span>
              </div>
              <div class="spotlight-meta-item">
                <small>Project period</small>
                <span>${featuredProject.year}</span>
              </div>
              <div class="spotlight-meta-item">
                <small>Location</small>
                <span>${featuredProject.location}</span>
              </div>
            </div>

            <div>
              <a href="#project-detail" class="btn btn-gold" id="btn-view-spotlight-case">
                View project details <span class="btn-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Architectural Disciplines Snapshot -->
    <section class="section-spacing">
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-8); flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <span class="section-tag">How we can help</span>
            <h2>Ways we can help with your temple</h2>
          </div>
          <a href="#services" class="btn btn-outline-gold">View all services →</a>
        </div>

        <div class="service-preview-grid">
          ${servicesData.slice(0, 3).map(service => `
            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: var(--space-6); border-radius: 4px; transition: all var(--transition-normal);">
              <div style="font-family: var(--font-serif); font-size: 1.8rem; color: var(--gold-primary); margin-bottom: var(--space-2);">${service.number}</div>
              <h3 style="font-size: 1.25rem; margin-bottom: 4px;">${service.title}</h3>
              <p style="font-family: var(--font-editorial); font-style: italic; color: var(--gold-bright); font-size: 0.95rem; margin-bottom: var(--space-3);">${service.subtitle}</p>
              <p style="font-size: 0.9rem; color: var(--text-ivory-soft);">${service.description.substring(0, 160)}...</p>
              <a href="#services" class="btn-ghost" style="display: inline-block; margin-top: var(--space-3); font-size: 0.8rem;">
                Learn more →
              </a>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Master Artisanal Craft Gallery Strip -->
    <section class="section-spacing" style="background: var(--bg-surface); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Stone craft</span>
          <h2>Stone carving and detail</h2>
          <p>See how carved details and thoughtful design can shape a sacred space.</p>
        </div>

        <div class="craft-grid">
          <div style="position: relative; border-radius: 4px; overflow: hidden; border: 1px solid var(--gold-border);">
            <img src="/assets/sthapathi_craft.jpg" alt="Artisan working on a stone carving" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: var(--space-4); background: linear-gradient(to top, rgba(10,11,13,0.95), transparent);">
              <span class="section-tag">Hand-Sculpted Relief</span>
              <p style="color: var(--text-ivory); font-weight: 500; margin: 0;">Carved details bring texture and character to stonework.</p>
            </div>
          </div>
          <div style="position: relative; border-radius: 4px; overflow: hidden; border: 1px solid var(--gold-border);">
            <img src="/assets/mandapam_hall.jpg" alt="Pillared hall inside a temple" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: var(--space-4); background: linear-gradient(to top, rgba(10,11,13,0.95), transparent);">
              <span class="section-tag">Temple halls</span>
              <p style="color: var(--text-ivory); font-weight: 500; margin: 0;">Columned spaces can bring people together for worship and community events.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Conversion Banner -->
    <section class="section-spacing" style="text-align: center; background: radial-gradient(circle at center, rgba(197, 160, 89, 0.12) 0%, var(--bg-dark) 70%);">
      <div class="container" style="max-width: 820px;">
        <span class="section-tag">Ready to begin?</span>
        <h2 style="font-size: clamp(2.2rem, 4.5vw, 3.2rem); margin-bottom: var(--space-3);">A first conversation can help bring your idea into focus.</h2>
        <p class="lead" style="margin-bottom: var(--space-6);">
          Share what you know so far. We can discuss the kind of support that may suit your project.
        </p>
        <a href="#start-project" class="btn btn-gold" style="padding: 18px 44px; font-size: 0.9rem;">
          START YOUR PROJECT <span class="btn-arrow">→</span>
        </a>
      </div>
    </section>
  `;

  let activeHeroSlide = 0;
  const updateHeroSlide = index => {
    activeHeroSlide = (index + heroSlides.length) % heroSlides.length;
    const slide = heroSlides[activeHeroSlide];
    const image = document.getElementById('home-slider-image');
    image.src = slide.image;
    image.alt = slide.alt;
    document.getElementById('home-slider-eyebrow').textContent = slide.eyebrow;
    document.getElementById('home-slider-title').innerHTML = slide.title;
    document.getElementById('home-slider-description').textContent = slide.description;
    document.querySelectorAll('.home-slider-dot').forEach((dot, dotIndex) => {
      const selected = dotIndex === activeHeroSlide;
      dot.classList.toggle('active', selected);
      dot.setAttribute('aria-pressed', String(selected));
    });
  };
  appView.querySelectorAll('[data-hero-slide]').forEach(button => {
    button.addEventListener('click', () => updateHeroSlide(Number(button.dataset.heroSlide)));
  });
  appView.querySelectorAll('[data-hero-direction]').forEach(button => {
    button.addEventListener('click', () => updateHeroSlide(activeHeroSlide + Number(button.dataset.heroDirection)));
  });

  // Attach event listener for featured project button
  const btnSpotlight = document.getElementById('btn-view-spotlight-case');
  if (btnSpotlight) {
    btnSpotlight.addEventListener('click', () => {
      state.selectedProjectId = featuredProject.id;
      btnSpotlight.href = `#project-detail?id=${encodeURIComponent(featuredProject.id)}`;
    });
  }
}

/* 2. PROJECTS PAGE (EDITORIAL GALLERY & FILTERS) */
function renderProjectsPage() {
  const filteredProjects = filterProjects(projectsData, state.projectFilter, state.searchQuery);

  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Our work</span>
          <h1>Temple projects, from idea to stone</h1>
          <p class="lead">
            Browse temple and stonework projects. Filter by project type or search by name and place. Open a project to see its location, status and design story.
          </p>
        </div>

        <!-- Filter Pills Bar & Search Bar -->
        <div class="projects-header-filter">
          <div class="filter-pills-bar">
            <button class="filter-pill ${state.projectFilter === 'all' ? 'active' : ''}" data-filter="all">All projects (${projectsData.length})</button>
            <button class="filter-pill ${state.projectFilter === 'chola' ? 'active' : ''}" data-filter="chola">Temple projects</button>
            <button class="filter-pill ${state.projectFilter === 'gopuram' ? 'active' : ''}" data-filter="gopuram">Rajagopurams</button>
          </div>

          <div style="max-width: 480px;">
            <label class="form-label" for="project-search-input">Find your inspiration</label>
            <input type="search" id="project-search-input" class="form-input" placeholder="Search projects by name, stone or location" value="${escapeHtml(state.searchQuery)}">
          </div>
        </div>

        <p class="project-results-status" id="project-results-status" role="status">${filteredProjects.length} of ${projectsData.length} projects</p>
        <!-- Projects Asymmetric Grid -->
        <div class="projects-grid">
          ${projectsData.map(p => `
            <a class="project-card" data-id="${p.id}" href="#project-detail?id=${encodeURIComponent(p.id)}" ${filteredProjects.includes(p) ? '' : 'hidden'}>
              <div class="project-card-media">
                <img src="${p.image}" alt="${p.title}" class="project-card-img" loading="lazy" decoding="async">
                <div class="project-tag-chips">
                  ${p.tags.map(t => `<span class="tag-chip">${t}</span>`).join('')}
                </div>
              </div>
              <div class="project-card-body">
                <span class="section-tag" style="padding: 2px 8px; font-size: 0.65rem;">${p.location}</span>
                <h3 class="project-card-title">${p.title}</h3>
                <p class="project-card-subtitle">${p.subtitle}</p>
                
                <div class="project-card-specs">
                  <span>${p.stoneType.split('(')[0]}</span>
                  <span style="color: var(--gold-primary); font-weight: 600;">${p.status}</span>
                </div>

                <div style="margin-top: var(--space-4);">
                  <span class="btn-ghost" style="font-size: 0.8rem; padding: 0;">
                    View project details →
                  </span>
                </div>
              </div>
            </a>
          `).join('')}
        </div>

          <div id="projects-empty" ${filteredProjects.length ? 'hidden' : ''} style="text-align: center; padding: var(--space-12) 0; color: var(--text-muted);">
            <h3>No projects match these filters.</h3>
            <p>Try a different name, location or architectural tradition.</p>
            <button class="btn btn-outline-gold" id="btn-reset-filters" style="margin-top: var(--space-4);">Clear All Filters</button>
          </div>
      </div>
    </div>
  `;

  // Filter existing cards rather than replacing the input on each keystroke.
  const searchInput = document.getElementById('project-search-input');
  function updateResults() {
    const matches = filterProjects(projectsData, state.projectFilter, state.searchQuery);
    const ids = new Set(matches.map(project => project.id));
    appView.querySelectorAll('.project-card').forEach(card => {
      const isVisible = ids.has(card.dataset.id);
      const wasHidden = card.hidden;
      card.hidden = !isVisible;
      if (isVisible && wasHidden && !reducedMotion.matches) {
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = 'childStaggerIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both';
      }
    });
    appView.querySelectorAll('[data-filter]').forEach(button => {
      const active = button.dataset.filter === state.projectFilter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('project-results-status').textContent = `${matches.length} of ${projectsData.length} projects`;
    document.getElementById('projects-empty').hidden = matches.length > 0;
  }
  appView.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    state.projectFilter = button.dataset.filter;
    updateResults();
  }));
  searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value;
    updateResults();
  });
  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    state.projectFilter = 'all'; state.searchQuery = ''; searchInput.value = '';
    updateResults(); searchInput.focus();
  });
  updateResults();
}

/* 3. PROJECT DETAIL (ARCHITECTURAL CASE STUDY) */
function renderProjectDetailPage() {
  const project = projectsData.find(p => p.id === state.selectedProjectId) || projectsData[0];

  appView.innerHTML = `
    <!-- Case Study Hero -->
    <section class="case-study-hero">
      <div class="container">
        <a class="case-back-link" href="#projects">← Back to all projects</a>
        <!-- Project Switcher Tabs -->
        <div style="display: flex; gap: 8px; overflow-x: auto; margin-bottom: var(--space-6); padding-bottom: 8px;">
          ${projectsData.map(p => `
            <button class="filter-pill ${p.id === project.id ? 'active' : ''}" data-project-switch="${p.id}" style="font-size: 0.72rem;">
              ${p.title}
            </button>
          `).join('')}
        </div>

        <span class="section-tag">${project.status} · ${project.year}</span>
        <h1 style="margin: var(--space-2) 0;">${project.title}</h1>
        <p class="lead" style="max-width: 820px;">
          ${project.subtitle}. Located in ${project.location}. This page shares the project overview, materials and work carried out.
        </p>

        <!-- Key Metrics Matrix -->
        <div class="case-study-matrix">
          <div class="matrix-cell">
            <small>Project type</small>
            <strong>${project.footprint}</strong>
          </div>
          <div class="matrix-cell">
            <small>Status</small>
            <strong>${project.status}</strong>
          </div>
          <div class="matrix-cell">
            <small>Project period</small>
            <strong>${project.year}</strong>
          </div>
          <div class="matrix-cell">
            <small>Location</small>
            <strong>${project.location}</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- Case Study Chapters -->
    <section class="section-spacing">
      <div class="container">
        <div class="case-layout">
          <div>
            <!-- The 6 Deep-Dive Chapters -->
            <div class="chapters-container">
              <div class="chapter-block">
                <div class="chapter-heading">
                  <h4>Project goal</h4>
                  <p>What was planned</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.vision.text}</p>
                </div>
              </div>

              <div class="chapter-block">
                <div class="chapter-heading">
                  <h4>Layout & traditions</h4>
                  <p>Design considerations</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.concept.text}</p>
                </div>
              </div>

              <!-- Blueprint Feature Display -->
              <div class="blueprint-showcase">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
                  <span class="section-tag">Design reference</span>
                </div>
                <div class="blueprint-img-wrapper">
                  <img src="/assets/temple_blueprint.jpg" alt="Vimana Elevation & Vastu Mandala Blueprint">
                </div>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: var(--space-2); text-align: center;">
                  An illustrative reference for discussing temple layout and architectural details.
                </p>
              </div>

              <div class="chapter-block">
                <div class="chapter-heading">
                  <h4>Design & drawings</h4>
                  <p>Planning information</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.design.text}</p>
                </div>
              </div>

              <!-- Craft Photo Display -->
              <div style="border: 1px solid var(--gold-border); border-radius: 4px; overflow: hidden; margin: var(--space-4) 0;">
                <img src="/assets/sthapathi_craft.jpg" alt="Artisan working on a traditional stone carving" style="width: 100%; max-height: 440px; object-fit: cover;">
              </div>

              <div class="chapter-block">
                <div class="chapter-heading">
                  <h4>Stonework</h4>
                  <p>Materials & details</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.craft.text}</p>
                </div>
              </div>

              <div class="chapter-block">
                <div class="chapter-heading">
                  <h4>Construction</h4>
                  <p>Site work & coordination</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.execution.text}</p>
                </div>
              </div>

              <div class="chapter-block" style="border-left-color: var(--gold-bright);">
                <div class="chapter-heading">
                  <h4 style="color: var(--gold-bright);">Project update</h4>
                  <p>${project.status} · ${project.year}</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.completed.text}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Sticky Sidebar Specifications -->
          <div style="background: var(--bg-surface); border: 1px solid var(--gold-border); border-radius: 4px; padding: var(--space-6); position: sticky; top: 104px;">
            <div style="margin-bottom: var(--space-4); border-radius: 4px; overflow: hidden; height: 200px; border: 1px solid var(--bronze-border);">
              <img src="${project.image}" alt="${project.title}" style="width: 100%; height: 100%; object-fit: cover; object-position: center 10%;">
            </div>
            <span class="section-tag">Project at a glance</span>
            <h3 style="font-size: 1.35rem; margin: var(--space-2) 0;">${project.title}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">${project.subtitle}</p>

            <div style="margin: var(--space-4) 0; display: flex; flex-direction: column; gap: var(--space-3); font-size: 0.85rem;">
              <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--gold-primary);">Location</span>
                <strong>${project.location}</strong>
              </div>
              <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--gold-primary);">Main material</span>
                <strong>${project.stoneType}</strong>
              </div>
              <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--gold-primary);">Project type</span>
                <strong>${project.footprint}</strong>
              </div>
              <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--gold-primary);">Project details</span>
                <strong>${project.vimanaHeight}</strong>
              </div>
              <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--gold-primary);">Status</span>
                <strong>${project.status}</strong>
              </div>
            </div>

            <a href="#start-project" class="btn btn-gold" style="width: 100%; margin-top: var(--space-4); font-size: 0.8rem;">
              Plan a project like this →
            </a>
          </div>
        </div>
      </div>
    </section>
  `;

  // Attach project switcher listeners
  document.querySelectorAll('[data-project-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = `project-detail?id=${encodeURIComponent(btn.getAttribute('data-project-switch'))}`;
    });
  });
}

/* 4. SERVICES PAGE (7 PILLARS) */
function renderServicesPage() {
  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">What we can help with</span>
          <h1>Temple design and project support</h1>
          <p class="lead">
            Explore the types of support available, what each one can include and what information we need to plan the next step with you.
          </p>
        </div>

        <div class="services-list">
          ${servicesData.map(service => `
            <div class="service-pillar-card">
              <div class="service-num">${service.number}</div>

              <div class="service-main">
                <span class="section-tag" style="padding: 2px 8px; font-size: 0.65rem;">${service.leadDiscipline}</span>
                <h3>${service.title}</h3>
                <div class="service-subtitle">${service.subtitle}</div>
                <p style="color: var(--text-ivory-soft); font-size: 0.95rem;">${service.description}</p>
                <div style="margin-top: var(--space-3); font-size: 0.82rem; color: var(--gold-bright); font-style: italic;">
                  Planning note: ${service.technicalSpec}
                </div>
              </div>

              <div class="service-deliverables-box">
                <h5>What this may include</h5>
                <ul class="deliverables-checklist">
                  ${service.deliverables.map(d => `<li>${d}</li>`).join('')}
                </ul>
                <div style="margin-top: var(--space-4);">
                  <a href="#start-project" data-inquire-service="${escapeHtml(service.title)}" class="btn btn-outline-gold" style="font-size: 0.72rem; padding: 8px 16px; width: 100%;">
                    Ask about this service →
                  </a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Consultation Banner -->
        <div style="margin-top: var(--space-12); background: var(--bg-surface); border: 1px solid var(--gold-border); padding: var(--space-8); border-radius: 4px; text-align: center;">
          <span class="section-tag">Not sure where to start?</span>
          <h3>Tell us what you need help with.</h3>
          <p style="max-width: 680px; margin: var(--space-2) auto var(--space-6);">
            If you are unsure where to begin, share a few details and we can discuss your project needs and possible next steps.
          </p>
          <a href="#start-project" class="btn btn-gold">
          Tell us about your project →
          </a>
        </div>
      </div>
    </div>
  `;
}

/* 5. TEMPLE DESIGN & SACRED ANATOMY */
function renderTempleDesignPage() {
  const currentAnatomy = templeAnatomyData.find(a => a.id === state.selectedAnatomyId) || templeAnatomyData[0];

  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">A simple design guide</span>
          <h1>Temple styles and the spaces within them</h1>
          <p class="lead">
            Explore a few South Indian temple traditions, then use the interactive guide to learn about common parts of a temple. These references can help you describe what you like when planning a project.
          </p>
        </div>

        <!-- 4 Architectural Styles -->
        <h2 style="font-size: 1.8rem; margin-bottom: var(--space-6);">Temple styles to explore</h2>
        <div class="styles-grid">
          ${templeStylesData.map(style => `
            <div class="style-card">
              <div class="style-era">${style.era} &bull; ${style.origin}</div>
              <h3 style="font-size: 1.5rem; margin-bottom: var(--space-2);">${style.name}</h3>
              <p style="font-size: 0.92rem; color: var(--text-ivory-soft);">${style.description}</p>
              
              <div style="margin-top: var(--space-4);">
                <strong style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--gold-primary);">Details you may notice</strong>
                <ul class="style-features-list">
                  ${style.keyFeatures.map(f => `<li>${f}</li>`).join('')}
                </ul>
              </div>

              <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: var(--space-3); margin-top: var(--space-4); font-size: 0.78rem; color: var(--text-muted);">
                <span>Reference: <em>${style.canonicalText}</em></span>
                <span style="color: var(--gold-bright);">Common material: ${style.stonePreference.split(',')[0]}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Interactive Clickable Sacred Anatomy Explorer -->
        <div class="anatomy-explorer" id="anatomy-explorer-section">
          <div style="margin-bottom: var(--space-6);">
            <span class="section-tag">Interactive guide</span>
            <h2>Explore the parts of a temple</h2>
            <p>Select a part on the image or use the buttons to see its name and purpose.</p>
          </div>

          <!-- Selector buttons -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: var(--space-6);">
            ${templeAnatomyData.map(a => `
              <button class="filter-pill ${a.id === state.selectedAnatomyId ? 'active' : ''}" data-anatomy-btn="${a.id}" aria-pressed="${a.id === state.selectedAnatomyId}">
                ${a.name.split('(')[0]}
              </button>
            `).join('')}
          </div>

          <div class="anatomy-layout">
            <!-- Visual Schematic Frame with Hotspot Pins -->
            <div class="anatomy-viewer-frame">
              <img src="/assets/temple_blueprint.jpg" alt="Temple Sacred Anatomy Blueprint Diagram">
              
              <!-- Hotspot pins positioned relative to drawing -->
              ${templeAnatomyData.map(a => `
                <div class="anatomy-hotspot-pin ${a.id === state.selectedAnatomyId ? 'active' : ''}" 
                     style="left: ${a.hotspot.x}; top: ${a.hotspot.y};" 
                     data-anatomy-pin="${a.id}" 
                     title="${a.name}" role="button" tabindex="0" aria-label="${escapeHtml(a.name)}" aria-pressed="${a.id === state.selectedAnatomyId}">
                </div>
              `).join('')}
            </div>

            <!-- Dynamic Detail Card -->
            <div class="anatomy-details-pane">
              <div class="anatomy-role-badge">${currentAnatomy.role}</div>
              <h3 class="anatomy-title gold-text">${currentAnatomy.name}</h3>

              <div class="anatomy-detail-item">
                <strong>What it is</strong>
                <p>${currentAnatomy.meaning}</p>
              </div>

              <div class="anatomy-detail-item">
                <strong>How it is shaped</strong>
                <p>${currentAnatomy.geometry}</p>
              </div>

              <div class="anatomy-detail-item">
                <strong>Common materials</strong>
                <p>${currentAnatomy.materials}</p>
              </div>

              <div class="anatomy-detail-item">
                <strong>Why it matters</strong>
                <p>${currentAnatomy.significance}</p>
              </div>

              <div style="margin-top: var(--space-6);">
                <a href="#start-project" class="btn btn-outline-gold" style="font-size: 0.75rem; width: 100%;">
                  Discuss this for your project →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach anatomy switcher listeners
  document.querySelectorAll('[data-anatomy-btn], [data-anatomy-pin]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-anatomy-btn') || el.getAttribute('data-anatomy-pin');
      const attribute = el.hasAttribute('data-anatomy-pin') ? 'data-anatomy-pin' : 'data-anatomy-btn';
      const scrollY = window.scrollY;
      state.selectedAnatomyId = id;
      renderTempleDesignPage();
      appView.querySelector(`[${attribute}="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    });
  });
}

/* 6. ABOUT PAGE */
function renderAboutPage() {
  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <!-- Hero Story -->
        <div class="about-hero-grid">
          <div>
            <span class="section-tag">About Sri Akil</span>
              <h1>${aboutData.heritage.headline}</h1>
            <p class="lead" style="margin: var(--space-4) 0;">
              "${aboutData.heritage.quote}"
            </p>
            <p>
              ${aboutData.heritage.story}
            </p>
          </div>

          <div style="border: 1px solid var(--gold-border); border-radius: 4px; overflow: hidden; box-shadow: var(--shadow-lg);">
            <img src="/assets/sthapathi_craft.jpg" alt="Artisan working on a traditional stone carving" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        </div>

        <!-- Studio Philosophy Principles -->
        <div style="margin: var(--space-12) 0;">
          <span class="section-tag">How we work</span>
          <h2>What you can expect from us</h2>
          <div class="principles-grid" style="margin-top: var(--space-6);">
            ${aboutData.philosophy.map(p => `
              <div style="background: var(--bg-card); border: 1px solid var(--gold-border); padding: var(--space-6); border-radius: 4px;">
                <h3 style="font-size: 1.25rem; color: var(--gold-bright); margin-bottom: var(--space-2);">${p.title}</h3>
                <p style="font-size: 0.92rem; color: var(--text-ivory-soft);">${p.description}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Areas of support -->
        <div style="margin: var(--space-12) 0;">
          <span class="section-tag">Areas of support</span>
          <h2>People and skills for each stage</h2>
          <p style="max-width: 680px; margin-bottom: var(--space-6);">
            The people and specialist input needed depend on the project. We will explain who needs to be involved and what each stage requires.
          </p>

          <div class="team-grid">
            ${aboutData.team.map(member => `
              <div class="team-card">
                <div class="team-card-role">${member.role}</div>
                <h3 style="font-size: 1.45rem; margin-bottom: 2px;">${member.name}</h3>
                <div class="team-credentials">${member.credentials}</div>
                <p style="font-size: 0.9rem; color: var(--text-ivory-soft); margin: 0;">${member.bio}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Core Values Grid -->
        <div style="margin-top: var(--space-12);">
          <span class="section-tag">Our approach</span>
          <h2>Good decisions, made together</h2>
          <div class="values-grid">
            ${aboutData.values.map(val => `
              <div class="value-card">
                <div class="value-badge">${val.badge}</div>
                <h4 style="font-size: 1.05rem; margin-bottom: var(--space-2);">${val.title}</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${val.detail}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* 7. PROCESS PAGE (8-STAGE TIMELINE) */
function renderProcessPage() {
  const currentStage = processStagesData.find(s => s.step === state.selectedProcessStep) || processStagesData[0];

  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">What happens next</span>
          <h1>A clear path from first idea to handover</h1>
          <p class="lead">
            Every project is different. Here is a simple guide to the usual steps. We agree the scope, timing and responsibilities with you before work begins.
          </p>
        </div>

        <!-- Horizontal Stepper Bar -->
        <div class="timeline-stages-bar">
          ${processStagesData.map(stage => `
            <button class="timeline-nav-btn ${stage.step === state.selectedProcessStep ? 'active' : ''}" data-step-btn="${stage.step}" aria-pressed="${stage.step === state.selectedProcessStep}">
              <span class="stage-num">${stage.step}</span>
              <span>${stage.title.split('&')[0]}</span>
            </button>
          `).join('')}
        </div>

        <!-- Stage Detail Card -->
        <div class="stage-detail-card">
          <div>
            <div style="margin-bottom: var(--space-2);">
              <span class="stage-phase-badge">${currentStage.phase}</span>
              <span class="stage-duration-tag">&bull; Timing: ${currentStage.duration}</span>
            </div>

            <h2 style="font-size: clamp(1.8rem, 3vw, 2.4rem); margin-bottom: var(--space-2);">
              Stage ${currentStage.step}: ${currentStage.title}
            </h2>
            <p class="lead" style="color: var(--gold-bright); margin-bottom: var(--space-4);">
              ${currentStage.summary}
            </p>

            <p style="color: var(--text-ivory-soft); font-size: 1rem; line-height: 1.85;">
              ${currentStage.description}
            </p>

            <div class="milestone-badge">
              <small>Review point</small>
                <span>${currentStage.milestone}</span>
            </div>
          </div>

          <div class="stage-deliverables">
            <h4 style="font-size: 0.82rem; letter-spacing: 0.18em; color: var(--gold-primary); margin-bottom: var(--space-3);">
              WHAT WE WILL REVIEW TOGETHER
            </h4>
            <ul class="deliverables-checklist">
              ${currentStage.deliverables.map(d => `<li>${d}</li>`).join('')}
            </ul>

            <div style="margin-top: var(--space-8); padding-top: var(--space-6); border-top: 1px solid var(--border-subtle);">
              <a href="#start-project" class="btn btn-gold" style="width: 100%; font-size: 0.78rem;">
                Tell us about your project →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach stepper click listeners
  document.querySelectorAll('[data-step-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const scrollY = window.scrollY;
      const scrollLeft = appView.querySelector('.timeline-stages-bar').scrollLeft;
      state.selectedProcessStep = btn.getAttribute('data-step-btn');
      renderProcessPage();
      appView.querySelector('.timeline-stages-bar').scrollLeft = scrollLeft;
      appView.querySelector(`[data-step-btn="${state.selectedProcessStep}"]`)?.focus({ preventScroll: true });
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    });
  });
}

/* 8. INSIGHTS PAGE (ARTICLES & MODAL READER) */
function renderInsightsPage() {
  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Helpful reading</span>
          <h1>Simple guides for planning and caring for a temple</h1>
          <p class="lead">
            Short introductions to common project questions, materials, temple spaces and repair planning. These guides are a starting point; the right solution depends on each site.
          </p>
        </div>

        <div class="insights-grid">
          ${insightsData.map(article => `
            <div class="insight-card" data-article-id="${article.id}" role="button" tabindex="0" aria-label="Read ${escapeHtml(article.title)}">
              <div class="insight-media">
                <img src="${article.image}" alt="${article.title}" class="insight-img" loading="lazy" decoding="async">
              </div>
              <div class="insight-body">
                <div class="insight-meta">
                  <span>${article.category}</span>
                  <span>&bull;</span>
                  <span>${article.readTime}</span>
                </div>
                <h3 class="insight-title">${article.title}</h3>
                <p style="font-size: 0.92rem; color: var(--text-ivory-soft); margin-bottom: var(--space-4);">
                  ${article.excerpt}
                </p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: var(--space-3); margin-top: auto; font-size: 0.78rem; color: var(--text-muted);">
                  <span>${article.author} · ${article.role}</span>
                  <span class="btn-ghost" style="padding: 0; font-size: 0.78rem;">Read this guide →</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach article click listeners
  document.querySelectorAll('.insight-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-article-id');
      openArticleModal(id);
    });
  });
}

function openArticleModal(articleId) {
  const article = insightsData.find(a => a.id === articleId);
  if (!article) return;

  const modal = document.getElementById('insight-reader-modal');
  const content = document.getElementById('modal-insight-content');

  content.innerHTML = `
    <div style="margin-bottom: var(--space-4);">
      <span class="section-tag">${article.category}</span>
      <h2 style="font-size: clamp(1.8rem, 3.5vw, 2.5rem); margin: var(--space-2) 0;">${article.title}</h2>
      <div style="display: flex; gap: var(--space-3); font-size: 0.85rem; color: var(--gold-bright); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
        <span>${article.author} · ${article.role}</span>
        <span>&bull;</span>
        <span>${article.date}</span>
        <span>&bull;</span>
        <span>${article.readTime}</span>
      </div>
    </div>

    <div style="margin: var(--space-6) 0; border-radius: 4px; overflow: hidden; border: 1px solid var(--gold-border);">
      <img src="${article.image}" alt="${article.title}" style="width: 100%; max-height: 400px; object-fit: cover;">
    </div>

    <div style="font-size: 1.05rem; line-height: 1.9; color: var(--text-ivory-soft);">
      ${article.content}
    </div>

    <div style="margin-top: var(--space-8); padding-top: var(--space-6); border-top: 1px solid var(--gold-border); text-align: center;">
      <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: var(--space-3);">
        Have a question about your project?
      </p>
      <a href="#start-project" class="btn btn-gold">
        Talk about your project →
      </a>
    </div>
  `;

  modalReturnFocus = document.activeElement;
  modal.inert = false;
  modal.classList.add('open');
  document.getElementById('insight-reader-dialog').scrollTop = 0;
  syncOverlayState();
  document.getElementById('modal-close-insight').focus();
}

document.getElementById('modal-close-insight').addEventListener('click', () => closeArticle());
document.getElementById('insight-reader-modal').addEventListener('click', event => {
  if (event.target.id === 'insight-reader-modal') closeArticle();
});
appView.addEventListener('click', event => {
  const serviceLink = event.target.closest('[data-inquire-service]');
  if (serviceLink) projectWizard.selectService(serviceLink.dataset.inquireService);
});
appView.addEventListener('keydown', event => {
  const card = event.target.closest('.insight-card, .anatomy-hotspot-pin');
  if (card && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    card.click();
  }
});

/* 9. CONTACT PAGE */
function renderContactPage() {
  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <!-- Hero Header -->
        <div class="contact-hero">
          <span class="section-tag">Talk to Sri Akil</span>
          <h1>Tell us what you are planning</h1>
          <p class="lead" style="max-width: 720px; margin: var(--space-3) auto 0;">
            Share a little about your temple, site or repair project. You do not need a finished plan to get in touch.
          </p>
        </div>

        <!-- Contact Main Grid -->
        <div class="contact-grid">
          <!-- Left: Inquiry Form -->
          <div class="contact-form-panel">
            <span class="section-tag">A good place to start</span>
            <h3>Send us a short message</h3>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: var(--space-4);">
              Tell us what you need help with and how you would prefer to be contacted. After you submit, choose email or WhatsApp to send your message.
            </p>

            <div id="contact-feedback" class="contact-form-feedback" role="status" aria-live="polite" hidden></div>

            <form id="contact-form" novalidate>
              <div class="contact-form-grid">
                <div class="contact-form-group">
                  <label for="contact-name">Full Name *</label>
                  <input type="text" id="contact-name" class="form-input" placeholder="e.g. Srikanth Ramanathan" required>
                </div>

                <div class="contact-form-group">
                  <label for="contact-email">Email Address *</label>
                  <input type="email" id="contact-email" class="form-input" placeholder="patron@example.com" required>
                </div>

                <div class="contact-form-group">
                  <label for="contact-phone">Phone / WhatsApp *</label>
                  <input type="tel" id="contact-phone" class="form-input" placeholder="+91 98765 43210" required>
                </div>

                <div class="contact-form-group">
                  <label for="contact-studio">How should we contact you?</label>
                  <select id="contact-studio" class="form-input">
                    <option value="Email" selected>Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Either">Either is fine</option>
                  </select>
                </div>

                <div class="contact-form-group contact-form-full">
                  <label for="contact-type">What do you need help with?</label>
                  <select id="contact-type" class="form-input">
                    <option value="New temple">A new temple</option>
                    <option value="Temple entrance">A temple entrance or gateway</option>
                    <option value="Hall or mandapam">A hall or mandapam</option>
                    <option value="Stonework">Stonework or sculpture</option>
                    <option value="Repair or restoration">Repair or restoration</option>
                    <option value="Design advice">Design advice</option>
                    <option value="Not sure yet">I am not sure yet</option>
                  </select>
                </div>

                <div class="contact-form-group contact-form-full">
                  <label for="contact-message">Your message *</label>
                  <textarea id="contact-message" class="form-input" rows="4" placeholder="Where is the project? What would you like help with? Share any details you already know." required></textarea>
                </div>

                <div class="contact-form-full" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4); margin-top: var(--space-2);">
                  <button type="submit" class="btn btn-gold" id="btn-submit-contact">
                    Prepare my message <span class="btn-arrow">→</span>
                  </button>
                  <a href="#start-project" class="btn-ghost" style="font-size: 0.8rem;">
                    Or use the step-by-step project planner →
                  </a>
                </div>
              </div>
            </form>
          </div>

          <!-- Direct contact details -->
          <div class="contact-studios-panel">
            <div class="contact-studio-card">
              <div class="studio-card-header">
                <span class="studio-card-city">Call or WhatsApp</span>
                <span class="studio-card-tag">Direct contact</span>
              </div>
              <div class="studio-contact-links">
                <a href="tel:+919790224561">+91 97902 24561</a>
                <a href="tel:+919940295932">+91 99402 95932</a>
              </div>
            </div>

            <div class="contact-studio-card">
              <div class="studio-card-header">
                <span class="studio-card-city">Email the studio</span>
                <span class="studio-card-tag">Project enquiries</span>
              </div>
              <div class="studio-contact-links">
                <a href="mailto:akilanmaneesha@gmail.com">akilanmaneesha@gmail.com</a>
                <a href="mailto:gayathriakilan17@gmail.com">gayathriakilan17@gmail.com</a>
              </div>
            </div>

          </div>
        </div>

        <!-- Quick Direct Contact Channels Strip -->
        <div class="contact-quick-channels">
          <div class="quick-channel-card">
            <div style="font-size: 1.6rem; margin-bottom: 8px;" aria-hidden="true">01</div>
            <h4>Not ready with a plan?</h4>
            <p>That is okay. Tell us what you know so far, and we can take it from there.</p>
          </div>

          <div class="quick-channel-card">
            <div style="font-size: 1.6rem; margin-bottom: 8px;" aria-hidden="true">02</div>
            <h4>Have a drawing or photo?</h4>
            <p>You can mention what you have in your message. We will let you know how to share it.</p>
          </div>

          <div class="quick-channel-card">
            <div style="font-size: 1.6rem; margin-bottom: 8px;" aria-hidden="true">03</div>
            <h4>Prefer a longer conversation?</h4>
            <p>Use the project planner to share your ideas, location and the kind of help you need.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach contact form listener
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('contact-feedback');
  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const phone = document.getElementById('contact-phone').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      const studio = document.getElementById('contact-studio').value;
      const type = document.getElementById('contact-type').value;

      if (!name || !email || !phone || !message) {
        feedback.hidden = false;
        feedback.className = 'contact-form-feedback error';
        feedback.textContent = 'Please fill out all required fields marked with an asterisk (*).';
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        feedback.hidden = false;
        feedback.className = 'contact-form-feedback error';
        feedback.textContent = 'Please enter a valid email address.';
        return;
      }

      const subject = `${type} enquiry — Sri Akil`;
      const body = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone / WhatsApp: ${phone}`,
        `Preferred reply: ${studio}`,
        `Project: ${type}`,
        '',
        message
      ].join('\n');
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      const emailLink = `mailto:akilanmaneesha@gmail.com,gayathriakilan17@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;
      const whatsappLink = `https://wa.me/919790224561?text=${encodeURIComponent(`${subject}\n\n${body}`)}`;
      feedback.hidden = false;
      feedback.className = 'contact-form-feedback prepared';
      feedback.innerHTML = `
        <strong>Your message is ready, ${escapeHtml(name)}.</strong>
        <p>This page has not sent your message. Choose email or WhatsApp to send your ${escapeHtml(type.toLowerCase())} enquiry.</p>
        <div class="contact-message-actions">
          <a class="btn btn-gold" href="${emailLink}">Open email app</a>
          <a class="btn btn-outline-gold" href="${whatsappLink}" target="_blank" rel="noopener noreferrer">Open WhatsApp</a>
        </div>
      `;
      feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}
