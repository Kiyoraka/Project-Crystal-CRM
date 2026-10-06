/* Crystal Inc — landing page behaviour: BM/EN toggle, phone menu, before/after sliders, optional photos. */
(function () {
  'use strict';

  const T = {
    bm: { navServices: 'Perkhidmatan', navGallery: 'Galeri', navTesti: 'Testimoni', navArea: 'Kawasan', heroTitle: 'Renovate rumah anda tanpa pening kepala', ctaPrimary: 'Semak Anggaran Renovation Anda', ctaSecondary: 'Dapatkan Free Consultation', howTitle: 'Cara ia berfungsi', servicesTitle: 'Perkhidmatan', galleryTitle: 'Sebelum / Selepas', galleryHint: 'Seret pemegang untuk banding', whyTitle: 'Kenapa Crystal', testiTitle: 'Testimoni', areaTitle: 'Kawasan liputan', finalTitle: 'Sedia untuk mula?', finalBody: 'Isi borang 2 minit. Kami hubungi anda dalam 24 jam — tiada komitmen.' },
    en: { navServices: 'Services', navGallery: 'Gallery', navTesti: 'Reviews', navArea: 'Coverage', heroTitle: 'Renovate your home without the headache', ctaPrimary: 'Check Your Renovation Estimate', ctaSecondary: 'Get a Free Consultation', howTitle: 'How it works', servicesTitle: 'Services', galleryTitle: 'Before / After', galleryHint: 'Drag the handle to compare', whyTitle: 'Why Crystal', testiTitle: 'Reviews', areaTitle: 'Coverage', finalTitle: 'Ready to start?', finalBody: 'A 2-minute form. We call you within 24 hours — no commitment.' }
  };

  /* ---------- Language ---------- */
  function setLang(lang) {
    const dict = T[lang] || T.bm;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = dict[el.getAttribute('data-i18n')]; });
    document.querySelectorAll('[data-lang]').forEach(b => {
      const on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.documentElement.lang = lang === 'en' ? 'en' : 'ms';
    try { localStorage.setItem('crystal.lang', lang); } catch (_) { /* ignore */ }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-lang]');
    if (b) setLang(b.getAttribute('data-lang'));
  });
  let saved = 'bm';
  try { saved = localStorage.getItem('crystal.lang') || 'bm'; } catch (_) { /* ignore */ }
  if (saved !== 'bm') setLang(saved);

  /* ---------- Phone menu ---------- */
  const menuBtn = document.getElementById('menu-btn');
  const menu = document.getElementById('lp-menu');
  function toggleMenu(force) {
    const open = typeof force === 'boolean' ? force : menu.hidden;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  menuBtn.addEventListener('click', () => toggleMenu());
  menu.addEventListener('click', e => { if (e.target.closest('a')) toggleMenu(false); });

  /* ---------- Before / after sliders ---------- */
  const captions = ['Dapur · Teres, Bayan Lepas', 'Ruang tamu · Semi-D, Shah Alam', 'Bilik air · Kondo, Mont Kiara', 'Extension · Banglo, Sungai Petani'];
  const handleIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 7l-4 5 4 5M16 7l4 5-4 5"/></svg>';
  document.getElementById('gallery').innerHTML = captions.map((caption, i) => `
    <div class="ba">
      <div class="ba-frame">
        <div class="ba-layer"><div class="photo-slot" data-photo="ba-after-${i + 1}"><span>Selepas</span></div></div>
        <div class="ba-layer ba-before"><div class="photo-slot" data-photo="ba-before-${i + 1}"><span>Sebelum</span></div></div>
        <div class="ba-line"></div>
        <div class="ba-handle">${handleIcon}</div>
        <span class="ba-tag ba-tag-before">Sebelum</span>
        <span class="ba-tag ba-tag-after">Selepas</span>
        <input class="ba-range" type="range" min="2" max="98" value="50" aria-label="Seret untuk banding: ${caption}">
        <span class="ba-focus"></span>
      </div>
      <div class="ba-caption">${caption}</div>
    </div>`).join('');
  document.getElementById('gallery').addEventListener('input', e => {
    if (!e.target.classList.contains('ba-range')) return;
    e.target.closest('.ba-frame').style.setProperty('--pos', e.target.value + '%');
  });

  /* ---------- Photos: assets/img/<slot>.jpg (gpt-image-2 renders, Oct 6 2026) ----------
     Replace any file with the client's real project photo under the same name.
     A slot missing from this list keeps its labelled placeholder. */
  const PHOTOS = ['hero', 'svc-renovation', 'svc-id', 'svc-construction', 'svc-makeover',
    'ba-before-1', 'ba-before-2', 'ba-before-3', 'ba-before-4',
    'ba-after-1', 'ba-after-2', 'ba-after-3', 'ba-after-4', 'coverage-map'];
  document.querySelectorAll('[data-photo]').forEach(slot => {
    const id = slot.getAttribute('data-photo');
    const src = PHOTOS.includes(id) ? 'assets/img/' + id + '.jpg' : null;
    if (!src) return;
    slot.style.backgroundImage = 'url("' + src + '")';
    slot.classList.add('has-img');
  });
})();
