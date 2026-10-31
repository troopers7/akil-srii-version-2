import { projectsData } from '../data/projectsData.js';
import { invitationsData } from '../data/invitationsData.js';
import { templeGalleryData } from '../data/templeGalleryData.js';
import { escapeHtml } from '../utils/planner.js';

/* ==========================================================================
   HD LIGHTBOX VIEWER CONTROLLER (Zoom, Rotate, Pan & Download)
   ========================================================================== */
let lightboxState = {
  zoom: 1.0,
  rotation: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  translateX: 0,
  translateY: 0,
};

export function initHdLightboxViewer() {
  const modal = document.getElementById('hd-lightbox-modal');
  const imgWrapper = document.getElementById('hd-lightbox-img-wrapper');
  const img = document.getElementById('hd-lightbox-img');
  const titleElem = document.getElementById('hd-lightbox-title');
  const subElem = document.getElementById('hd-lightbox-subtitle');
  const downloadBtn = document.getElementById('hd-download-btn');
  const closeBtn = document.getElementById('hd-lightbox-close');

  const btnZoomIn = document.getElementById('hd-zoom-in');
  const btnZoomOut = document.getElementById('hd-zoom-out');
  const btnReset = document.getElementById('hd-zoom-reset');
  const btnRotateLeft = document.getElementById('hd-rotate-left');
  const btnRotateRight = document.getElementById('hd-rotate-right');
  const viewport = document.getElementById('hd-lightbox-viewport');

  if (!modal || !imgWrapper || !img) return;

  function updateTransform() {
    imgWrapper.style.transform = `translate(${lightboxState.translateX}px, ${lightboxState.translateY}px) scale(${lightboxState.zoom}) rotate(${lightboxState.rotation}deg)`;
  }

  function resetView() {
    lightboxState.zoom = 1.0;
    lightboxState.rotation = 0;
    lightboxState.translateX = 0;
    lightboxState.translateY = 0;
    updateTransform();
  }

  window.openHdLightbox = function (item) {
    img.src = item.image;
    img.alt = item.title || 'HD Temple Image';
    titleElem.textContent = item.title || 'Sacred Temple Document';
    subElem.textContent = item.subtitle || item.description || item.temple || '';
    downloadBtn.href = item.image;
    downloadBtn.setAttribute('download', `${item.id || 'temple-image'}.jpg`);

    resetView();
    modal.classList.add('open');
    modal.inert = false;
    document.body.classList.add('overlay-open');
  };

  function closeLightbox() {
    modal.classList.remove('open');
    modal.inert = true;
    document.body.classList.remove('overlay-open');
  }

  closeBtn?.addEventListener('click', closeLightbox);

  modal.addEventListener('click', e => {
    if (e.target === viewport) closeLightbox();
  });

  btnZoomIn?.addEventListener('click', () => {
    lightboxState.zoom = Math.min(3.5, lightboxState.zoom + 0.3);
    updateTransform();
  });

  btnZoomOut?.addEventListener('click', () => {
    lightboxState.zoom = Math.max(0.5, lightboxState.zoom - 0.3);
    updateTransform();
  });

  btnReset?.addEventListener('click', resetView);

  btnRotateLeft?.addEventListener('click', () => {
    lightboxState.rotation = (lightboxState.rotation - 90 + 360) % 360;
    updateTransform();
  });

  btnRotateRight?.addEventListener('click', () => {
    lightboxState.rotation = (lightboxState.rotation + 90) % 360;
    updateTransform();
  });

  // Dragging support when zoomed
  viewport?.addEventListener('mousedown', e => {
    if (lightboxState.zoom <= 1.0) return;
    lightboxState.isDragging = true;
    lightboxState.startX = e.clientX - lightboxState.translateX;
    lightboxState.startY = e.clientY - lightboxState.translateY;
  });

  window.addEventListener('mousemove', e => {
    if (!lightboxState.isDragging) return;
    lightboxState.translateX = e.clientX - lightboxState.startX;
    lightboxState.translateY = e.clientY - lightboxState.startY;
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    lightboxState.isDragging = false;
  });

  // Keyboard accessibility
  window.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === '+' || e.key === '=') {
      lightboxState.zoom = Math.min(3.5, lightboxState.zoom + 0.3);
      updateTransform();
    } else if (e.key === '-' || e.key === '_') {
      lightboxState.zoom = Math.max(0.5, lightboxState.zoom - 0.3);
      updateTransform();
    } else if (e.key === '0') {
      resetView();
    } else if (e.key.toLowerCase() === 'r') {
      lightboxState.rotation = (lightboxState.rotation + 90) % 360;
      updateTransform();
    }
  });
}

/* ==========================================================================
   RUNNING PROJECTS SECTION (Home & Dedicated Page)
   ========================================================================== */
export function renderRunningProjectsHtml() {
  return `
    <section class="running-projects-section" id="running-projects-section">
      <div class="container">
        <div class="running-projects-header">
          <span class="section-tag">Ongoing & Landmark Sthapathi Works</span>
          <h2>Running & Consecrated Temple Projects</h2>
          <p>
            Master Dravidian stone craft, Rajagopurams, and traditional sanctum restorations actively shaped by hereditary sthapatis across Tamil Nadu and South India.
          </p>
        </div>

        <div class="running-projects-grid">
          ${projectsData.map(p => `
            <article class="running-project-card">
              <div class="running-project-media">
                <img src="${p.image}" alt="${p.title}" class="running-project-img" loading="lazy">
                <span class="running-project-badge ${p.status === 'Ongoing' ? 'ongoing' : ''}">
                  ${p.status}
                </span>
              </div>
              <div class="running-project-body">
                <span class="running-project-loc">${p.location}</span>
                <h3 class="running-project-title">${p.title}</h3>
                <p class="running-project-desc">
                  ${p.subtitle} · Built in ${p.stoneType}.
                </p>
                <div class="running-project-footer">
                  <span style="font-size: 0.75rem; color: #888;">${p.year}</span>
                  <a href="#project-detail?id=${encodeURIComponent(p.id)}" class="running-project-link">
                    Project Info →
                  </a>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

/* ==========================================================================
   OUR PROJECTS — INVITATIONS PREVIEW (Home Page Banner)
   ========================================================================== */
export function renderHomeInvitationsBanner() {
  const previewCards = invitationsData.slice(0, 4);
  return `
    <section class="section-spacing" style="background: #231c18; color: #fff;">
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; flex-wrap: wrap; gap: 20px;">
          <div>
            <span class="section-tag" style="color: #f0b46d;">Sacred Consecration Patrika Archive</span>
            <h2 style="color: #fff; margin: 8px 0;">Our Projects — Invitations (HD Clear)</h2>
            <p style="color: #cfc8be; max-width: 650px;">
              Authentic Maha Kumbabishekam invitation cards, auspicious muhurtham patrika, yagasalai puja schedules, and sthapathi citations from our completed temple consecrations.
            </p>
          </div>
          <a href="#projects-invitations" class="btn btn-gold" style="white-space: nowrap;">
            View All Invitations Archive (${invitationsData.length}) →
          </a>
        </div>

        <div class="running-projects-grid">
          ${previewCards.map((inv, idx) => `
            <div class="invitation-card" style="border-color: rgba(197, 133, 45, 0.3);">
              <div class="invitation-card-media" onclick='window.openHdLightbox(${JSON.stringify(inv)})'>
                <img src="${inv.image}" alt="${inv.title}" class="invitation-card-img" loading="lazy">
                <span class="invitation-hd-badge">HD 100%</span>
                <div class="invitation-card-overlay">
                  <span class="invitation-inspect-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Zoom & Rotate
                  </span>
                </div>
              </div>
              <div class="invitation-card-info">
                <span class="invitation-card-temple">${inv.temple}</span>
                <h4 class="invitation-card-title" style="font-size: 1rem;">${inv.title}</h4>
                <p class="invitation-card-subtitle" style="font-size: 0.8rem;">${inv.subtitle}</p>
                <div class="invitation-card-actions">
                  <span style="font-size: 0.72rem; color: #a94319; font-weight: 600;">Maha Kumbabishekam</span>
                  <button type="button" class="invitation-view-btn" onclick='window.openHdLightbox(${JSON.stringify(inv)})'>
                    Inspect HD →
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

/* ==========================================================================
   TEMPLE GALLERY PREVIEW (Home Page Grid)
   ========================================================================== */
export function renderHomeGalleryPreview() {
  const highlights = templeGalleryData.slice(0, 8);
  return `
    <section class="section-spacing" style="background: #fdfcf9;">
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; flex-wrap: wrap; gap: 20px;">
          <div>
            <span class="section-tag">Sacred Architecture Photography</span>
            <h2 style="color: #302b28; margin: 8px 0;">Temple Architecture Gallery</h2>
            <p style="color: #68686a; max-width: 680px;">
              High-resolution archive of Rajagopurams, Garbhagriha Vimanas, carved monolithic stone mandapams, and hereditary sthapathi craftsmanship.
            </p>
          </div>
          <a href="#temple-gallery" class="btn btn-outline-gold">
            Explore All 99 Temple Photos →
          </a>
        </div>

        <div class="temple-gallery-grid">
          ${highlights.map((t, i) => `
            <div class="temple-gallery-item ${i === 0 ? 'tall' : ''} ${i === 3 ? 'wide' : ''}" onclick='window.openHdLightbox(${JSON.stringify(t)})'>
              <img src="${t.image}" alt="${t.title}" class="temple-gallery-img" loading="lazy">
              <div class="temple-gallery-item-overlay">
                <span class="temple-gallery-item-category">${t.category}</span>
                <h4 class="temple-gallery-item-title">${t.title}</h4>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

/* ==========================================================================
   DEDICATED PAGE: OUR PROJECTS — INVITATIONS (HD Patrika Showcase)
   ========================================================================== */
export function renderProjectsInvitationsPage(container, state) {
  const query = (state.invitationSearchQuery || '').toLowerCase();
  const filtered = invitationsData.filter(inv => {
    if (!query) return true;
    return (
      inv.title.toLowerCase().includes(query) ||
      inv.temple.toLowerCase().includes(query) ||
      inv.subtitle.toLowerCase().includes(query)
    );
  });

  container.innerHTML = `
    <div class="invitations-page-header">
      <div class="container">
        <span class="invitations-header-badge">Traditional Consecration Archive</span>
        <h1 class="invitations-header-title">Our Projects — Sacred Invitations</h1>
        <p class="invitations-header-sub">
          Authentic Maha Kumbabishekam invitation cards, auspicious muhurtham patrika, yagasalai puja schedules, and sthapathi citations from our completed temple consecrations. Each card has been enhanced to crystal clear HD.
        </p>
        <div class="invitations-controls-strip">
          <input 
            type="search" 
            id="invitation-search-input" 
            class="form-input" 
            style="max-width: 440px; background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.25);" 
            placeholder="Search invitations by temple, event or date..." 
            value="${escapeHtml(state.invitationSearchQuery || '')}">
          <span style="color: #f0b46d; font-size: 0.85rem; font-weight: 600; padding: 8px 16px; background: rgba(0,0,0,0.4); border-radius: 20px;">
            Showing ${filtered.length} of ${invitationsData.length} HD Consecration Invitations
          </span>
        </div>
      </div>
    </div>

    <div class="container section-spacing" style="padding-top: 40px;">
      <div class="invitations-grid">
        ${filtered.map((inv, idx) => `
          <div class="invitation-card">
            <div class="invitation-card-media" onclick='window.openHdLightbox(${JSON.stringify(inv)})' role="button" tabindex="0" aria-label="Open HD viewer for ${inv.title}">
              <img src="${inv.image}" alt="${inv.title}" class="invitation-card-img" loading="lazy">
              <span class="invitation-hd-badge">HD</span>
              <div class="invitation-card-overlay">
                <span class="invitation-inspect-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Inspect (Zoom & Rotate)
                </span>
              </div>
            </div>
            <div class="invitation-card-info">
              <span class="invitation-card-temple">${inv.temple}</span>
              <h3 class="invitation-card-title">${inv.title}</h3>
              <p class="invitation-card-subtitle">${inv.subtitle}</p>
              <div class="invitation-card-actions">
                <span style="font-size: 0.72rem; color: #a94319; font-weight: 600;">Maha Kumbabishekam</span>
                <button type="button" class="invitation-view-btn" onclick='window.openHdLightbox(${JSON.stringify(inv)})'>
                  View HD Patrika →
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const searchInput = document.getElementById('invitation-search-input');
  searchInput?.addEventListener('input', e => {
    state.invitationSearchQuery = e.target.value;
    renderProjectsInvitationsPage(container, state);
  });
}

/* ==========================================================================
   DEDICATED PAGE: TEMPLE GALLERY (All 99 Extracted Authentic Photos)
   ========================================================================== */
export function renderTempleGalleryPage(container, state) {
  const currentCategory = state.galleryCategory || 'all';
  const query = (state.gallerySearchQuery || '').toLowerCase();

  const categories = [
    { id: 'all', label: `All Temple Photos (${templeGalleryData.length})` },
    { id: 'rajagopurams', label: 'Rajagopurams & Gateways' },
    { id: 'vimanas', label: 'Garbhagriha Vimanas' },
    { id: 'mandapams', label: 'Mandapams & Pillars' },
    { id: 'sculptures', label: 'Stone Sculptures & Idols' },
    { id: 'consecrations', label: 'Maha Kumbabishekam' },
  ];

  const filtered = templeGalleryData.filter(t => {
    const matchesCat = currentCategory === 'all' || t.category === currentCategory;
    const matchesQuery = !query || t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  container.innerHTML = `
    <div class="temple-gallery-header">
      <div class="container">
        <span class="section-tag" style="color: #f0b46d;">Sri Akil Sthapathi Portfolio</span>
        <h1 style="font-size: clamp(2.2rem, 4.5vw, 3.6rem); color: #fff; margin: 12px 0;">Master Temple Architecture Gallery</h1>
        <p style="color: #cfc8be; max-width: 780px; margin: 0 auto 28px; line-height: 1.6;">
          Complete photographic archive of authentic Dravidian Rajagopurams, sanctum vimanas, monolithic mandapams, and sacred stone carvings extracted from our historic project records.
        </p>

        <!-- Category Filter Pills -->
        <div class="invitations-controls-strip">
          ${categories.map(c => `
            <button class="invitations-filter-btn ${currentCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
              ${c.label}
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="container section-spacing" style="padding-top: 36px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <p style="color: #68686a; margin: 0; font-size: 0.9rem;">
          Showing <strong>${filtered.length}</strong> authentic temple photos. Click any image to view in HD Lightbox.
        </p>
      </div>

      <div class="temple-gallery-grid">
        ${filtered.map((t, idx) => `
          <div class="temple-gallery-item ${idx % 7 === 0 ? 'tall' : ''} ${idx % 11 === 0 ? 'wide' : ''}" onclick='window.openHdLightbox(${JSON.stringify(t)})' role="button" tabindex="0" aria-label="Open HD lightbox for ${t.title}">
            <img src="${t.image}" alt="${t.title}" class="temple-gallery-img" loading="lazy">
            <div class="temple-gallery-item-overlay">
              <span class="temple-gallery-item-category">${t.category}</span>
              <h4 class="temple-gallery-item-title">${t.title}</h4>
              <p style="font-size: 0.75rem; color: #ddd; margin: 4px 0 0; line-height: 1.3;">${t.description}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.galleryCategory = btn.dataset.cat;
      renderTempleGalleryPage(container, state);
    });
  });
}

/* ==========================================================================
   DEDICATED PAGE: RUNNING & ONGOING PROJECTS
   ========================================================================== */
export function renderRunningProjectsPage(container) {
  container.innerHTML = `
    <div class="invitations-page-header">
      <div class="container">
        <span class="invitations-header-badge">Active Sthapathi Craft</span>
        <h1 class="invitations-header-title">Running & Consecrated Temple Projects</h1>
        <p class="invitations-header-sub">
          Current stone construction, monumental Rajagopuram restorations, and sanctum renovations undertaken by Sri Akil Temple Architecture.
        </p>
      </div>
    </div>

    ${renderRunningProjectsHtml()}
  `;
}

/* ==========================================================================
   DEDICATED ARCHITECTURAL KNOWLEDGE PAGES (Rajesh Sompura Style)
   ========================================================================== */

export function renderGloryOfArchitecturePage(container) {
  container.innerHTML = `
    <div class="invitations-page-header">
      <div class="container">
        <span class="invitations-header-badge">Ancient Wisdom</span>
        <h1 class="invitations-header-title">The Glory of Dravidian & Hindu Temple Architecture</h1>
        <p class="invitations-header-sub">
          Exploring the timeless grandeur, cosmological symbolism, and monumental engineering of South Indian temples.
        </p>
      </div>
    </div>

    <div class="container section-spacing" style="max-width: 900px; line-height: 1.8; color: #34363a;">
      <h2 style="color: #a94319; margin-bottom: 16px;">The Sacred Cosmos in Granite</h2>
      <p class="lead">
        A Hindu temple is not simply a shelter for worship; it is the physical manifestation of the universe (Brahmanda) and the cosmic divine body (Purusha) realized in stone.
      </p>
      <p>
        In traditional Dravidian architecture, the temple complex acts as an ascension mandala. As a devotee approaches through the towering Rajagopuram, enters the pillared Mandapam, and passes through the ardha mandapam into the darkened silence of the Garbhagriha, the architecture guides consciousness from the outer multi-faceted world to the single, unmanifest source of light.
      </p>

      <div style="margin: 40px 0; border-left: 4px solid #a94319; padding-left: 24px; font-style: italic; color: #555;">
        "The Gopuram towers rise skyward like sacred mountains, calling devotees from miles away to center their hearts upon the divine."
      </div>

      <h3 style="color: #2b2522; margin-top: 36px;">Core Elements of the Dravidian Tradition</h3>
      <ul style="padding-left: 20px; margin-bottom: 30px;">
        <li><strong>Rajagopuram:</strong> The monumental gateway tower adorned with tiers of intricate stucco figures.</li>
        <li><strong>Vimana:</strong> The sanctum tower rising directly above the deity, crowned by a sacred gilded kalasam.</li>
        <li><strong>Kalyana & Maha Mandapams:</strong> Monolithic stone halls supported by carved yali pillars and geometric ceiling beams.</li>
        <li><strong>Prakaram:</strong> The sacred ambulatory corridors surrounding the central sanctum.</li>
      </ul>

      <div style="text-align: center; margin-top: 50px;">
        <a href="#temple-gallery" class="btn btn-gold">Explore Temple Gallery Photos →</a>
      </div>
    </div>
  `;
}

export function renderScienceOfArchitecturePage(container) {
  container.innerHTML = `
    <div class="invitations-page-header">
      <div class="container">
        <span class="invitations-header-badge">Shilpa Shastra & Agamas</span>
        <h1 class="invitations-header-title">The Sacred Science of Temple Architecture</h1>
        <p class="invitations-header-sub">
          Vastu Purusha Mandala, Ayadi Ganitam proportions, and seismic dry-fit stone masonry.
        </p>
      </div>
    </div>

    <div class="container section-spacing" style="max-width: 900px; line-height: 1.8; color: #34363a;">
      <h2 style="color: #a94319; margin-bottom: 16px;">Vastu Purusha Mandala & Ayadi Calculations</h2>
      <p class="lead">
        Every temple designed by Sri Akil is engineered according to ancient Agama Shastras and Ayadi Ganitam — an exact mathematical science that aligns temple dimensions to celestial frequencies.
      </p>
      <p>
        The Vastu Purusha Mandala is the fundamental blueprint: a sacred grid (typically 64 or 81 squares) where each cell corresponds to a specific cosmic deity. The Brahma Sthana (the innermost sanctum) is placed at the exact center of balance, radiating energy outward into the surrounding mandapams.
      </p>

      <div style="background: #f4efe9; border: 1px solid #e0d8cc; padding: 28px; border-radius: 8px; margin: 32px 0;">
        <h4 style="color: #a94319; margin-top: 0;">The Six Ayadi Verifications:</h4>
        <ol style="margin-bottom: 0; padding-left: 20px;">
          <li><strong>Aya (Income):</strong> Ensures spiritual and material prosperity for the community.</li>
          <li><strong>Vyaya (Expenditure):</strong> Proportioned so spiritual gains always exceed costs.</li>
          <li><strong>Yoni (Orientation):</strong> Aligns the temple entrance to auspicious compass coordinates.</li>
          <li><strong>Vara (Day of the Week):</strong> Harmonizes with cosmological planetary influences.</li>
          <li><strong>Nakshatra (Constellation):</strong> Corresponds to the ruling star of the deity and patron.</li>
          <li><strong>Ayu (Longevity):</strong> Guarantees structural endurance across hundreds of years.</li>
        </ol>
      </div>

      <div style="text-align: center; margin-top: 50px;">
        <a href="#start-project" class="btn btn-gold">Consult with our Sthapathis →</a>
      </div>
    </div>
  `;
}


