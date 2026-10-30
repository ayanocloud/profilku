/**
 * ====================================================================
 * PUBLIC PORTFOLIO CONTROLLER (main.js)
 * ====================================================================
 * Mengelola data fetching dari Google Sheets (atau fallback mock),
 * dynamic project rendering, category filtering, contact form submission,
 * dan animasi interaktif.
 * ====================================================================
 */

// State data global
let appState = {
  profile: {},
  projects: [],
  activeCategory: 'All',
  isLoading: true
};

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  initLucideIcons();
  setupEventListeners();
  loadPublicData();
  setupApiUrlModal();
});

function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Mengambil data profil dan portofolio dari Google Apps Script
 */
async function loadPublicData() {
  renderProjectsSkeleton();
  try {
    const response = await apiCall('getPublicData', {}, 'GET');
    
    if (response && response.status === 'success' && response.data) {
      appState.profile = response.data.profile || {};
      appState.projects = response.data.projects || [];
      appState.isLoading = false;

      // Render data ke antarmuka
      applyProfileData(appState.profile);
      renderCategoryFilters(appState.projects);
      renderProjectsList(appState.projects, appState.activeCategory);

      // Notifikasi status mode
      if (response.isMock) {
        showMockNotice();
      }
    } else {
      throw new Error(response.message || 'Gagal memuat data');
    }
  } catch (error) {
    console.error('Error saat load data profil:', error);
    showToast('Gagal terhubung ke Google Sheets API. Menggunakan data cadangan.', 'warning');
    // Fallback ke mock data
    appState.profile = MOCK_PUBLIC_DATA.profile;
    appState.projects = MOCK_PUBLIC_DATA.projects;
    appState.isLoading = false;

    applyProfileData(appState.profile);
    renderCategoryFilters(appState.projects);
    renderProjectsList(appState.projects, appState.activeCategory);
    showMockNotice();
  }
}

/**
 * Menampilkan banner informasi jika masih dalam mode demo/mock
 */
function showMockNotice() {
  const notice = document.getElementById('demo-mode-notice');
  if (notice) {
    notice.classList.remove('hidden');
  }
}

/**
 * Menempatkan data profil ke elemen-elemen DOM
 */
function applyProfileData(profile) {
  if (!profile) return;

  const name = profile.Name || 'Ahmad Rizky Pratama';
  const role = profile.Role || 'Full Stack Developer';
  const bio = profile.Bio || 'Software engineer & tech enthusiast.';
  const email = profile.Email || 'contact@example.com';
  const phone = profile.Phone || '+62 812-3456-7890';
  const github = profile.Github || 'https://github.com';
  const linkedin = profile.Linkedin || 'https://linkedin.com';
  const instagram = profile.Instagram || 'https://instagram.com';

  // Hero Section
  setTextContent('hero-name', name);
  setTextContent('hero-role', role);
  setTextContent('hero-bio', bio);
  setTextContent('nav-brand-name', name);

  // About Section
  setTextContent('about-bio', bio);
  setTextContent('about-email', email);
  setTextContent('about-phone', phone);

  // Social Links (Hero & Footer & Contact)
  setHref('link-github-hero', github);
  setHref('link-linkedin-hero', linkedin);
  setHref('link-instagram-hero', instagram);

  setHref('link-github-footer', github);
  setHref('link-linkedin-footer', linkedin);
  setHref('link-instagram-footer', instagram);

  setHref('contact-email-link', `mailto:${email}`);
  setTextContent('contact-email-text', email);

  setHref('contact-phone-link', `tel:${phone.replace(/\s+/g, '')}`);
  setTextContent('contact-phone-text', phone);

  // Footer Name
  setTextContent('footer-name', name);
  setTextContent('footer-year', new Date().getFullYear());

  initLucideIcons();
}

function setTextContent(elementId, text) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = text;
}

function setHref(elementId, url) {
  const el = document.getElementById(elementId);
  if (el && url) el.href = url;
}

/**
 * Membuat tombol filter kategori secara dinamis berdasarkan data proyek
 */
function renderCategoryFilters(projects) {
  const filterContainer = document.getElementById('project-filter-buttons');
  if (!filterContainer) return;

  // Ekstrak kategori unik
  const categories = ['All'];
  projects.forEach(p => {
    if (p.category && !categories.includes(p.category.trim())) {
      categories.push(p.category.trim());
    }
  });

  filterContainer.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    const isActive = cat === appState.activeCategory;
    btn.className = `filter-btn px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border ${
      isActive
        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25'
        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white hover:border-slate-600'
    }`;
    btn.textContent = cat === 'All' ? 'Semua Proyek' : cat;
    btn.addEventListener('click', () => {
      appState.activeCategory = cat;
      // Perbarui style button aktif
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.className = 'filter-btn px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white hover:border-slate-600';
      });
      btn.className = 'filter-btn px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25';

      renderProjectsList(appState.projects, cat);
    });

    filterContainer.appendChild(btn);
  });
}

/**
 * Merender daftar kartu proyek
 */
function renderProjectsList(projects, filterCategory = 'All') {
  const container = document.getElementById('projects-container');
  if (!container) return;

  const filtered = filterCategory === 'All'
    ? projects
    : projects.filter(p => (p.category || '').trim().toLowerCase() === filterCategory.trim().toLowerCase());

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
          <i data-lucide="folder-search" class="w-8 h-8"></i>
        </div>
        <h4 class="text-lg font-semibold text-white mb-1">Belum Ada Proyek</h4>
        <p class="text-sm text-slate-400 max-w-sm mx-auto">Tidak ditemukan proyek untuk kategori "${escapeHtml(filterCategory)}".</p>
      </div>
    `;
    initLucideIcons();
    return;
  }

  container.innerHTML = filtered.map(proj => {
    // Parsing tags tech stack
    const techTags = (proj.tech_stack || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(tag => `<span class="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">${escapeHtml(tag)}</span>`)
      .join('');

    const imageUrl = proj.image_url || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop';
    const projectUrl = proj.project_url && proj.project_url !== '#' ? proj.project_url : null;

    return `
      <article class="group bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col">
        <!-- Thumbnail -->
        <div class="relative h-52 w-full overflow-hidden bg-slate-800">
          <img 
            src="${escapeHtml(imageUrl)}" 
            alt="${escapeHtml(proj.title)}" 
            loading="lazy" 
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop'"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
          <span class="absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full bg-slate-950/80 text-indigo-300 backdrop-blur-md border border-white/10">
            ${escapeHtml(proj.category || 'General')}
          </span>
        </div>

        <!-- Body -->
        <div class="p-6 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
              ${escapeHtml(proj.title)}
            </h3>
            <p class="text-slate-400 text-sm line-clamp-3 mb-4 leading-relaxed">
              ${escapeHtml(proj.description || 'Tidak ada deskripsi.')}
            </p>
          </div>

          <div>
            <!-- Tech Stack Tags -->
            <div class="flex flex-wrap gap-1.5 mb-5">
              ${techTags}
            </div>

            <!-- Action Button -->
            <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              ${projectUrl 
                ? `<a href="${escapeHtml(projectUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                     Lihat Proyek <i data-lucide="external-link" class="w-4 h-4"></i>
                   </a>`
                : `<span class="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                     Internal Project <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                   </span>`
              }
              <button onclick="openProjectModal('${escapeHtml(proj.id)}')" class="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors">
                Detail
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  initLucideIcons();
}

/**
 * Skeleton Loader saat data sedang dimuat
 */
function renderProjectsSkeleton() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  const skeletonCard = `
    <div class="bg-slate-900/40 rounded-2xl border border-slate-800/50 overflow-hidden animate-pulse">
      <div class="h-52 bg-slate-800/70"></div>
      <div class="p-6 space-y-3">
        <div class="h-6 bg-slate-800 rounded w-3/4"></div>
        <div class="h-4 bg-slate-800/60 rounded w-full"></div>
        <div class="h-4 bg-slate-800/60 rounded w-2/3"></div>
        <div class="flex gap-2 pt-3">
          <div class="h-6 w-16 bg-slate-800/60 rounded"></div>
          <div class="h-6 w-16 bg-slate-800/60 rounded"></div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = skeletonCard.repeat(3);
}

/**
 * Event Listeners untuk form kontak, smooth scroll, dll
 */
function setupEventListeners() {
  // Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Tutup menu mobile ketika link diklik
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // Smooth Scroll offset for sticky navbar
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const navHeight = 80;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

/**
 * Menangani pengiriman pesan dari formulir kontak
 */
async function handleContactSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const subjectInput = document.getElementById('contact-subject');
  const messageInput = document.getElementById('contact-message');
  const submitBtn = document.getElementById('contact-submit-btn');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const subject = subjectInput.value.trim();
  const message = messageInput.value.trim();

  if (!name || !email || !message) {
    showToast('Mohon lengkapi Nama, Email, dan Pesan Anda.', 'warning');
    return;
  }

  // Tampilkan state loading
  const originalBtnHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>
    Mengirim Pesan...
  `;

  try {
    const payload = {
      name: name,
      email: email,
      subject: subject || 'Pesan dari Form Profil',
      message: message
    };

    const response = await apiCall('sendMessage', payload, 'POST');

    if (response && response.status === 'success') {
      showToast(response.message || 'Pesan Anda berhasil dikirim ke pemilik!', 'success');
      e.target.reset();
    } else {
      throw new Error(response.message || 'Gagal mengirim pesan');
    }
  } catch (error) {
    console.error('Error saat kirim pesan:', error);
    showToast('Gagal mengirim pesan. Silakan coba lagi nanti atau hubungi via email langsung.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
    initLucideIcons();
  }
}

/**
 * Modal Detail Proyek
 */
window.openProjectModal = function(projectId) {
  const proj = appState.projects.find(p => p.id === projectId);
  if (!proj) return;

  const modal = document.getElementById('project-detail-modal');
  const modalContent = document.getElementById('project-modal-content');
  if (!modal || !modalContent) return;

  const techTags = (proj.tech_stack || '')
    .split(',')
    .map(t => `<span class="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">${escapeHtml(t.trim())}</span>`)
    .join('');

  modalContent.innerHTML = `
    <div class="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900 rounded-t-2xl">
      <img src="${escapeHtml(proj.image_url)}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop'" />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
      <button onclick="closeProjectModal()" class="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:text-white border border-white/10 transition-colors">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
      <div class="absolute bottom-4 left-6 right-6">
        <span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-indigo-600 text-white mb-2">${escapeHtml(proj.category || 'General')}</span>
        <h3 class="text-2xl sm:text-3xl font-extrabold text-white">${escapeHtml(proj.title)}</h3>
      </div>
    </div>
    <div class="p-6 sm:p-8 space-y-6">
      <div>
        <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Deskripsi Proyek</h4>
        <p class="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">${escapeHtml(proj.description)}</p>
      </div>

      <div>
        <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Teknologi & Tools</h4>
        <div class="flex flex-wrap gap-2">${techTags}</div>
      </div>

      <div class="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        ${proj.project_url && proj.project_url !== '#'
          ? `<a href="${escapeHtml(proj.project_url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30">
               Buka URL Proyek <i data-lucide="external-link" class="w-4 h-4"></i>
             </a>`
          : `<span class="text-sm text-slate-500">Tautan eksternal tidak tersedia</span>`
        }
        <button onclick="closeProjectModal()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">
          Tutup
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  initLucideIcons();
};

window.closeProjectModal = function() {
  const modal = document.getElementById('project-detail-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
};

/**
 * Modal Pengaturan URL API Google Apps Script (Memudahkan konfigurasi tanpa edit file)
 */
function setupApiUrlModal() {
  const modal = document.getElementById('api-settings-modal');
  const openBtn = document.getElementById('btn-open-api-settings');
  const closeBtn = document.getElementById('btn-close-api-settings');
  const saveBtn = document.getElementById('btn-save-api-url');
  const input = document.getElementById('input-api-url');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      if (input) input.value = getApiUrl();
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  if (saveBtn && input && modal) {
    saveBtn.addEventListener('click', () => {
      const url = input.value.trim();
      setApiUrl(url);
      modal.classList.add('hidden');
      showToast('URL Google Apps Script disimpan! Memuat ulang data...', 'success');
      setTimeout(() => {
        loadPublicData();
      }, 500);
    });
  }
}
