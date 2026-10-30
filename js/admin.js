/**
 * ====================================================================
 * ADMIN DASHBOARD CONTROLLER (admin.js)
 * ====================================================================
 * Mengelola otentikasi passcode, state session localStorage,
 * sistem navigasi tab interaktif, CRUD portofolio proyek,
 * pembaruan data profil, dan manajemen pesan kontak.
 * ====================================================================
 */

// State Admin Global
let adminState = {
  isLoggedIn: false,
  passcode: '',
  profile: {},
  projects: [],
  messages: [],
  currentTab: 'projects', // 'profile', 'projects', 'messages'
  editingProjectId: null // null jika sedang tambah baru, string ID jika sedang edit
};

document.addEventListener('DOMContentLoaded', () => {
  initLucideIcons();
  setupAdminEventListeners();
  checkSavedSession();
  setupApiUrlModal();
});

function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Cek sesi login yang tersimpan di localStorage
 */
function checkSavedSession() {
  const savedPasscode = localStorage.getItem('admin_passcode');
  if (savedPasscode) {
    adminState.passcode = savedPasscode;
    executeLogin(savedPasscode, true);
  } else {
    showLoginView();
  }
}

/**
 * Tampilkan tampilan login (passcode lock screen)
 */
function showLoginView() {
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  if (loginView && dashboardView) {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
  }
}

/**
 * Tampilkan antarmuka dashboard utama
 */
function showDashboardView() {
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  if (loginView && dashboardView) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
  }
}

/**
 * Eksekusi otentikasi login
 */
async function executeLogin(passcode, isSilent = false) {
  const submitBtn = document.getElementById('login-submit-btn');
  const originalText = submitBtn ? submitBtn.innerHTML : 'Masuk Dashboard';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Memverifikasi...
    `;
  }

  try {
    const res = await apiCall('login', { passcode: passcode }, 'POST');
    
    if (res && res.status === 'success' && res.authorized) {
      adminState.isLoggedIn = true;
      adminState.passcode = passcode;
      localStorage.setItem('admin_passcode', passcode);

      if (!isSilent) {
        showToast(res.message || 'Login berhasil! Selamat datang di Dashboard.', 'success');
      }

      showDashboardView();
      await fetchAdminDashboardData();
    } else {
      throw new Error(res.message || 'Passcode salah!');
    }
  } catch (err) {
    console.error('Login error:', err);
    localStorage.removeItem('admin_passcode');
    showLoginView();
    if (!isSilent) {
      showToast(err.message || 'Gagal masuk: Passcode salah atau koneksi bermasalah.', 'error');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
    initLucideIcons();
  }
}

/**
 * Mengambil data lengkap admin (Profile, Projects, Messages)
 */
async function fetchAdminDashboardData() {
  try {
    const res = await apiCall('getAdminData', { passcode: adminState.passcode }, 'GET');
    
    if (res && res.status === 'success' && res.data) {
      adminState.profile = res.data.profile || {};
      adminState.projects = res.data.projects || [];
      adminState.messages = res.data.messages || [];

      // Update stat counters
      updateQuickStats();

      // Populate form dan tabel
      populateProfileForm(adminState.profile);
      renderAdminProjectsTable(adminState.projects);
      renderAdminMessagesTable(adminState.messages);

      if (res.isMock) {
        showToast('Info: Anda sedang menjalankan Admin dalam Mode Demo.', 'info');
      }
    } else {
      throw new Error(res.message || 'Gagal memuat data admin');
    }
  } catch (err) {
    console.error('Fetch admin data error:', err);
    showToast('Gagal memuat data dari spreadsheet: ' + err.message, 'error');
  }
}

/**
 * Update kartu statistik ringkas di atas dashboard
 */
function updateQuickStats() {
  const statProjects = document.getElementById('stat-total-projects');
  const statMessages = document.getElementById('stat-total-messages');
  const statApi = document.getElementById('stat-api-status');

  if (statProjects) statProjects.textContent = adminState.projects.length;
  if (statMessages) statMessages.textContent = adminState.messages.length;
  if (statApi) {
    const isMock = !getApiUrl();
    statApi.textContent = isMock ? 'Mode Demo' : 'Terhubung Live';
    statApi.className = isMock ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold';
  }

  // Update badge jumlah pesan di sidebar
  const badgeMessages = document.getElementById('badge-messages-count');
  if (badgeMessages) {
    badgeMessages.textContent = adminState.messages.length;
  }
}

/**
 * ====================================================================
 * TAB NAVIGATION SYSTEM
 * ====================================================================
 */
function switchTab(tabName) {
  adminState.currentTab = tabName;

  // Update visual tab buttons
  const tabs = ['profile', 'projects', 'messages'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const content = document.getElementById(`tab-content-${t}`);

    if (btn) {
      if (t === tabName) {
        btn.className = 'tab-nav-btn active flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition-all';
      } else {
        btn.className = 'tab-nav-btn flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all';
      }
    }

    if (content) {
      if (t === tabName) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    }
  });

  initLucideIcons();
}

/**
 * ====================================================================
 * TAB 1: PROFILE MANAGEMENT
 * ====================================================================
 */
function populateProfileForm(profile) {
  if (!profile) return;

  setInputValue('form-prof-name', profile.Name || '');
  setInputValue('form-prof-role', profile.Role || '');
  setInputValue('form-prof-bio', profile.Bio || '');
  setInputValue('form-prof-email', profile.Email || '');
  setInputValue('form-prof-phone', profile.Phone || '');
  setInputValue('form-prof-github', profile.Github || '');
  setInputValue('form-prof-linkedin', profile.Linkedin || '');
  setInputValue('form-prof-instagram', profile.Instagram || '');
  setInputValue('form-prof-passcode', profile.Admin_Passcode || adminState.passcode || '');

  // Update greeting text
  const adminName = document.getElementById('admin-profile-name');
  if (adminName && profile.Name) {
    adminName.textContent = profile.Name;
  }
}

async function handleProfileSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-profile');
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Menyimpan...`;

  const newPasscode = getInputValue('form-prof-passcode');

  const updatedProfileData = {
    Name: getInputValue('form-prof-name'),
    Role: getInputValue('form-prof-role'),
    Bio: getInputValue('form-prof-bio'),
    Email: getInputValue('form-prof-email'),
    Phone: getInputValue('form-prof-phone'),
    Github: getInputValue('form-prof-github'),
    Linkedin: getInputValue('form-prof-linkedin'),
    Instagram: getInputValue('form-prof-instagram'),
    Admin_Passcode: newPasscode
  };

  try {
    const res = await apiCall('updateProfile', {
      passcode: adminState.passcode,
      data: updatedProfileData
    }, 'POST');

    if (res && res.status === 'success') {
      showToast(res.message || 'Profil berhasil diperbarui di Google Sheets!', 'success');
      adminState.profile = updatedProfileData;
      
      // Jika passcode diubah, update state dan localStorage
      if (newPasscode && newPasscode !== adminState.passcode) {
        adminState.passcode = newPasscode;
        localStorage.setItem('admin_passcode', newPasscode);
        showToast('Passcode admin baru telah disimpan.', 'info');
      }

      populateProfileForm(adminState.profile);
    } else {
      throw new Error(res.message || 'Gagal menyimpan profil');
    }
  } catch (err) {
    console.error('Update profile error:', err);
    showToast('Gagal memperbarui profil: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
    initLucideIcons();
  }
}

/**
 * ====================================================================
 * TAB 2: PORTFOLIO / PROJECTS MANAGEMENT
 * ====================================================================
 */
function renderAdminProjectsTable(projects) {
  const tbody = document.getElementById('admin-projects-tbody');
  if (!tbody) return;

  if (projects.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center text-slate-400">
          <i data-lucide="folder-plus" class="w-10 h-10 mx-auto text-slate-600 mb-3"></i>
          <p class="text-sm font-medium">Belum ada portofolio proyek.</p>
          <button onclick="openProjectFormModal()" class="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
            Tambah Proyek Pertama
          </button>
        </td>
      </tr>
    `;
    initLucideIcons();
    return;
  }

  tbody.innerHTML = projects.map((p, index) => {
    return `
      <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
        <!-- Thumbnail & Title -->
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <img 
              src="${escapeHtml(p.image_url)}" 
              alt="${escapeHtml(p.title)}" 
              class="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0 border border-slate-700"
              onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400&auto=format&fit=crop'"
            />
            <div class="min-w-0">
              <div class="font-bold text-white text-sm truncate max-w-xs">${escapeHtml(p.title)}</div>
              <div class="text-xs text-slate-400 truncate max-w-xs">${escapeHtml(p.tech_stack || '-')}</div>
            </div>
          </div>
        </td>

        <!-- Category -->
        <td class="px-6 py-4">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            ${escapeHtml(p.category || 'General')}
          </span>
        </td>

        <!-- URL Link -->
        <td class="px-6 py-4 text-xs">
          ${p.project_url && p.project_url !== '#' 
            ? `<a href="${escapeHtml(p.project_url)}" target="_blank" class="text-indigo-400 hover:underline flex items-center gap-1">
                 Buka URL <i data-lucide="external-link" class="w-3 h-3"></i>
               </a>`
            : `<span class="text-slate-500">-</span>`
          }
        </td>

        <!-- Actions -->
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <button onclick="editProject('${escapeHtml(p.id)}')" class="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors" title="Edit Proyek">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteProject('${escapeHtml(p.id)}')" class="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors" title="Hapus Proyek">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  initLucideIcons();
}

/**
 * Buka Modal Form Proyek (Tambah / Edit)
 */
function openProjectFormModal(projectId = null) {
  adminState.editingProjectId = projectId;
  const modal = document.getElementById('project-form-modal');
  const titleEl = document.getElementById('modal-project-title');
  const form = document.getElementById('project-form');

  if (!modal || !form) return;

  if (projectId) {
    const proj = adminState.projects.find(p => p.id === projectId);
    if (!proj) return;

    if (titleEl) titleEl.textContent = 'Edit Portofolio Proyek';
    setInputValue('proj-form-title', proj.title || '');
    setInputValue('proj-form-category', proj.category || '');
    setInputValue('proj-form-tech', proj.tech_stack || '');
    setInputValue('proj-form-image', proj.image_url || '');
    setInputValue('proj-form-url', proj.project_url || '');
    setInputValue('proj-form-desc', proj.description || '');
  } else {
    if (titleEl) titleEl.textContent = 'Tambah Portofolio Baru';
    form.reset();
  }

  modal.classList.remove('hidden');
  initLucideIcons();
}

function closeProjectFormModal() {
  const modal = document.getElementById('project-form-modal');
  if (modal) modal.classList.add('hidden');
  adminState.editingProjectId = null;
}

/**
 * Handle submit tambah / edit proyek
 */
async function handleProjectFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-project-form');
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Menyimpan...`;

  const projectPayload = {
    title: getInputValue('proj-form-title'),
    category: getInputValue('proj-form-category'),
    tech_stack: getInputValue('proj-form-tech'),
    image_url: getInputValue('proj-form-image'),
    project_url: getInputValue('proj-form-url'),
    description: getInputValue('proj-form-desc')
  };

  try {
    let res;
    if (adminState.editingProjectId) {
      // Edit Existing
      projectPayload.id = adminState.editingProjectId;
      res = await apiCall('updateProject', {
        passcode: adminState.passcode,
        data: projectPayload
      }, 'POST');
    } else {
      // Add New
      res = await apiCall('addProject', {
        passcode: adminState.passcode,
        data: projectPayload
      }, 'POST');
    }

    if (res && res.status === 'success') {
      showToast(res.message || 'Proyek berhasil disimpan!', 'success');
      closeProjectFormModal();
      // Reload admin data
      await fetchAdminDashboardData();
    } else {
      throw new Error(res.message || 'Gagal menyimpan proyek');
    }
  } catch (err) {
    console.error('Error save project:', err);
    showToast('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
    initLucideIcons();
  }
}

/**
 * Trigger Edit Proyek
 */
window.editProject = function(projectId) {
  openProjectFormModal(projectId);
};

/**
 * Hapus Proyek dengan konfirmasi
 */
window.deleteProject = async function(projectId) {
  const confirmed = confirm('Apakah Anda yakin ingin menghapus proyek ini dari portofolio dan Google Sheets?');
  if (!confirmed) return;

  try {
    const res = await apiCall('deleteProject', {
      passcode: adminState.passcode,
      id: projectId
    }, 'POST');

    if (res && res.status === 'success') {
      showToast(res.message || 'Proyek berhasil dihapus!', 'success');
      await fetchAdminDashboardData();
    } else {
      throw new Error(res.message || 'Gagal menghapus proyek');
    }
  } catch (err) {
    console.error('Delete project error:', err);
    showToast('Gagal menghapus: ' + err.message, 'error');
  }
};

/**
 * ====================================================================
 * TAB 3: CONTACT MESSAGES MANAGEMENT
 * ====================================================================
 */
function renderAdminMessagesTable(messages) {
  const tbody = document.getElementById('admin-messages-tbody');
  if (!tbody) return;

  if (messages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center text-slate-400">
          <i data-lucide="inbox" class="w-10 h-10 mx-auto text-slate-600 mb-3"></i>
          <p class="text-sm font-medium">Kotak masuk masih kosong.</p>
          <p class="text-xs text-slate-500 mt-1">Pesan dari pengunjung melalui form kontak akan muncul di sini.</p>
        </td>
      </tr>
    `;
    initLucideIcons();
    return;
  }

  tbody.innerHTML = messages.map(m => {
    return `
      <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
        <td class="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
          ${escapeHtml(m.timestamp)}
        </td>
        <td class="px-6 py-4">
          <div class="font-bold text-white text-sm">${escapeHtml(m.name)}</div>
          <a href="mailto:${escapeHtml(m.email)}" class="text-xs text-indigo-400 hover:underline">${escapeHtml(m.email)}</a>
        </td>
        <td class="px-6 py-4 text-xs font-semibold text-slate-200">
          ${escapeHtml(m.subject || 'Tanpa Subjek')}
        </td>
        <td class="px-6 py-4 text-xs text-slate-300 max-w-sm">
          <div class="line-clamp-2">${escapeHtml(m.message)}</div>
        </td>
        <td class="px-6 py-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-2">
            <a href="mailto:${escapeHtml(m.email)}?subject=Re: ${encodeURIComponent(m.subject || 'Portfolio Inquiry')}" class="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors" title="Balas via Email">
              <i data-lucide="mail-reply" class="w-4 h-4"></i>
            </a>
            <button onclick="viewMessageDetail(${JSON.stringify(m).replace(/"/g, '&quot;')})" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Baca Pesan Lengkap">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteMessageRow(${m.rowIndex})" class="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors" title="Hapus Pesan">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  initLucideIcons();
}

/**
 * Modal Baca Pesan Lengkap
 */
window.viewMessageDetail = function(msg) {
  const modal = document.getElementById('message-detail-modal');
  const content = document.getElementById('message-detail-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="flex items-center justify-between pb-4 border-b border-slate-800">
      <div>
        <h3 class="font-bold text-lg text-white">${escapeHtml(msg.subject || 'Detail Pesan Masuk')}</h3>
        <p class="text-xs text-slate-400">${escapeHtml(msg.timestamp)}</p>
      </div>
      <button onclick="document.getElementById('message-detail-modal').classList.add('hidden')" class="p-1 rounded-lg text-slate-400 hover:text-white">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <div class="space-y-4 py-4 text-sm">
      <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <div class="font-bold text-white">${escapeHtml(msg.name)}</div>
          <div class="text-xs text-slate-400">${escapeHtml(msg.email)}</div>
        </div>
        <a href="mailto:${escapeHtml(msg.email)}?subject=Re: ${encodeURIComponent(msg.subject || '')}" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5">
          <i data-lucide="mail-reply" class="w-3.5 h-3.5"></i> Balas
        </a>
      </div>

      <div>
        <h5 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Isi Pesan:</h5>
        <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap">${escapeHtml(msg.message)}</div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  initLucideIcons();
};

/**
 * Hapus Pesan dari sheet Messages
 */
window.deleteMessageRow = async function(rowIndex) {
  const confirmed = confirm('Hapus pesan ini dari Google Sheets?');
  if (!confirmed) return;

  try {
    const res = await apiCall('deleteMessage', {
      passcode: adminState.passcode,
      rowIndex: rowIndex
    }, 'POST');

    if (res && res.status === 'success') {
      showToast(res.message || 'Pesan berhasil dihapus!', 'success');
      await fetchAdminDashboardData();
    } else {
      throw new Error(res.message || 'Gagal menghapus pesan');
    }
  } catch (err) {
    console.error('Delete message error:', err);
    showToast('Gagal: ' + err.message, 'error');
  }
};

/**
 * ====================================================================
 * EVENT LISTENERS SETUP
 * ====================================================================
 */
function setupAdminEventListeners() {
  // Login Form
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = getInputValue('login-passcode');
      if (!pass) {
        showToast('Masukkan passcode admin Anda.', 'warning');
        return;
      }
      executeLogin(pass);
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('admin_passcode');
      adminState.isLoggedIn = false;
      adminState.passcode = '';
      showLoginView();
      showToast('Anda telah keluar dari sesi admin.', 'info');
    });
  }

  // Tab Switching Buttons
  const tabProfileBtn = document.getElementById('tab-btn-profile');
  const tabProjectsBtn = document.getElementById('tab-btn-projects');
  const tabMessagesBtn = document.getElementById('tab-btn-messages');

  if (tabProfileBtn) tabProfileBtn.addEventListener('click', () => switchTab('profile'));
  if (tabProjectsBtn) tabProjectsBtn.addEventListener('click', () => switchTab('projects'));
  if (tabMessagesBtn) tabMessagesBtn.addEventListener('click', () => switchTab('messages'));

  // Profile Form Submit
  const profileForm = document.getElementById('admin-profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
  }

  // Project Form Submit
  const projectForm = document.getElementById('project-form');
  if (projectForm) {
    projectForm.addEventListener('submit', handleProjectFormSubmit);
  }

  // Modal Open / Close buttons
  const btnOpenProjectModal = document.getElementById('btn-open-project-modal');
  const btnCloseProjectModal = document.getElementById('btn-close-project-modal');
  const btnCancelProjectModal = document.getElementById('btn-cancel-project-modal');

  if (btnOpenProjectModal) btnOpenProjectModal.addEventListener('click', () => openProjectFormModal());
  if (btnCloseProjectModal) btnCloseProjectModal.addEventListener('click', closeProjectFormModal);
  if (btnCancelProjectModal) btnCancelProjectModal.addEventListener('click', closeProjectFormModal);
}

// Helpers Form Input
function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

/**
 * Setup Modal Konfigurasi API di Admin (dengan uji koneksi & diagnosa)
 */
function setupApiUrlModal() {
  const modal = document.getElementById('admin-api-modal');
  const openBtn = document.getElementById('admin-api-settings-btn');
  const closeBtn = document.getElementById('admin-close-api-modal');
  const saveBtn = document.getElementById('admin-save-api-url');
  const testBtn = document.getElementById('admin-btn-test-api-url');
  const resetBtn = document.getElementById('admin-reset-demo-api');
  const input = document.getElementById('admin-input-api-url');
  const feedbackBox = document.getElementById('admin-api-test-feedback');

  function showFeedback(message, type = 'info') {
    if (!feedbackBox) return;
    feedbackBox.classList.remove('hidden');
    if (type === 'success') {
      feedbackBox.className = 'p-3.5 rounded-xl text-xs border bg-emerald-950/70 border-emerald-500/40 text-emerald-300 flex items-start gap-2';
      feedbackBox.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i> <div>${escapeHtml(message)}</div>`;
    } else if (type === 'error') {
      feedbackBox.className = 'p-3.5 rounded-xl text-xs border bg-rose-950/70 border-rose-500/40 text-rose-300 flex items-start gap-2';
      feedbackBox.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4 text-rose-400 shrink-0 mt-0.5"></i> <div>${escapeHtml(message)}</div>`;
    } else {
      feedbackBox.className = 'p-3.5 rounded-xl text-xs border bg-indigo-950/70 border-indigo-500/40 text-indigo-300 flex items-start gap-2';
      feedbackBox.innerHTML = `<i data-lucide="loader" class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-spin"></i> <div>${escapeHtml(message)}</div>`;
    }
    initLucideIcons();
  }

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      if (input) input.value = getApiUrl();
      if (feedbackBox) feedbackBox.classList.add('hidden');
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  // Reset Demo Mode
  if (resetBtn && input) {
    resetBtn.addEventListener('click', () => {
      input.value = '';
      setApiUrl('');
      showFeedback('Mode demo lokal telah diaktifkan kembali.', 'info');
      setTimeout(async () => {
        modal.classList.add('hidden');
        showToast('Menggunakan mode demo lokal.', 'info');
        if (adminState.isLoggedIn) {
          await fetchAdminDashboardData();
        }
      }, 700);
    });
  }

  // Uji Koneksi Langsung
  if (testBtn && input) {
    testBtn.addEventListener('click', async () => {
      const rawUrl = input.value.trim();
      if (!rawUrl) {
        showFeedback('Masukkan URL Google Apps Script Anda terlebih dahulu.', 'error');
        return;
      }

      const origText = testBtn.innerHTML;
      testBtn.disabled = true;
      testBtn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Menguji...`;
      initLucideIcons();
      showFeedback('Menguji koneksi ke Google Apps Script...', 'info');

      try {
        const testRes = await testGasConnection(rawUrl);
        if (testRes.success) {
          if (testRes.sanitizedUrl !== rawUrl) {
            input.value = testRes.sanitizedUrl;
          }
          let msg = testRes.message;
          if (testRes.notice) msg += ` (${testRes.notice})`;
          showFeedback(msg, 'success');
        } else {
          showFeedback(testRes.error, 'error');
        }
      } catch (e) {
        showFeedback('Uji koneksi gagal: ' + e.message, 'error');
      } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = origText;
        initLucideIcons();
      }
    });
  }

  // Simpan URL
  if (saveBtn && input && modal) {
    saveBtn.addEventListener('click', async () => {
      const rawUrl = input.value.trim();
      if (!rawUrl) {
        setApiUrl('');
        modal.classList.add('hidden');
        showToast('URL dikosongkan. Kembali ke mode demo.', 'info');
        if (adminState.isLoggedIn) await fetchAdminDashboardData();
        return;
      }

      const val = validateAndSanitizeGasUrl(rawUrl);
      if (!val.valid) {
        showFeedback(val.error, 'error');
        return;
      }

      const finalUrl = setApiUrl(rawUrl);
      input.value = finalUrl;
      modal.classList.add('hidden');
      showToast('URL Google Apps Script disimpan! Menghubungkan ulang...', 'success');
      if (adminState.isLoggedIn) {
        await fetchAdminDashboardData();
      }
    });
  }
}
