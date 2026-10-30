/**
 * ====================================================================
 * API & UTILITY HELPER (api.js)
 * ====================================================================
 * Mengelola komunikasi HTTP Fetch ke Google Apps Script Web App,
 * penanganan fallback demo data jika belum deploy, dan sistem notifikasi toast.
 * ====================================================================
 */

// Ganti URL ini dengan URL Web App Google Apps Script Anda setelah di-Deploy!
// Format: https://script.google.com/macros/s/AKfycbx.../exec
const DEFAULT_GAS_API_URL = "";

// Ambil URL tersimpan di localStorage atau gunakan default
function getApiUrl() {
  const customUrl = localStorage.getItem('gas_api_url');
  if (customUrl && customUrl.trim() !== "") {
    return customUrl.trim();
  }
  return DEFAULT_GAS_API_URL.trim();
}

// Simpan custom URL (berguna saat setting API URL dari modal/pengaturan)
function setApiUrl(url) {
  if (url && url.trim() !== "") {
    localStorage.setItem('gas_api_url', url.trim());
  } else {
    localStorage.removeItem('gas_api_url');
  }
}

/**
 * Data Cadangan (Mock Data) untuk preview instan ketika Google Apps Script
 * belum di-deploy atau sedang dijalankan di lingkungan lokal tanpa internet.
 */
const MOCK_PUBLIC_DATA = {
  profile: {
    Name: "Ahmad Rizky Pratama",
    Role: "Full Stack Developer & Cloud Architect",
    Bio: "Software engineer berdedikasi dengan fokus pada pengembangan ekosistem web modern, cloud architecture, dan UI/UX interaktif. Senang memecahkan masalah kompleks dan merancang solusi digital yang berdampak nyata.",
    Email: "ahmad.rizky@example.com",
    Phone: "+62 812-3456-7890",
    Github: "https://github.com",
    Linkedin: "https://linkedin.com",
    Instagram: "https://instagram.com"
  },
  projects: [
    {
      id: "proj_1",
      title: "FinTech Smart Analytics Dashboard",
      description: "Platform visualisasi data keuangan real-time dengan prediksi machine learning dan integrasi payment gateway internasional.",
      image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
      tech_stack: "Next.js, Tailwind CSS, TypeScript, Chart.js, PostgreSQL",
      category: "Web Development",
      project_url: "https://github.com",
      created_at: new Date().toISOString()
    },
    {
      id: "proj_2",
      title: "OmniCommerce Mobile Experience",
      description: "Aplikasi belanja multi-vendor berbasis mobile dengan notifikasi push instan, tracking pesanan live, dan katalog interaktif.",
      image_url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1000&auto=format&fit=crop",
      tech_stack: "React Native, Redux, Node.js, GraphQL, Redis",
      category: "Mobile App",
      project_url: "https://github.com",
      created_at: new Date().toISOString()
    },
    {
      id: "proj_3",
      title: "NeuralDoc - AI Document Processor",
      description: "Sistem otomatisasi ekstraksi invoice dan dokumen hukum berbasis OCR cerdas dan Large Language Model dengan akurasi 99.4%.",
      image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
      tech_stack: "Python, FastAPI, Gemini API, PyTorch, Docker",
      category: "Artificial Intelligence",
      project_url: "https://github.com",
      created_at: new Date().toISOString()
    },
    {
      id: "proj_4",
      title: "Aura UI - Modern Design System",
      description: "Design system komprehensif untuk startup enterprise dengan 80+ komponen siap pakai, dark mode otomatis, dan aksesibilitas WCAG AAA.",
      image_url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1000&auto=format&fit=crop",
      tech_stack: "Figma, Storybook, Vanilla CSS, Tailwind, Webpack",
      category: "UI/UX Design",
      project_url: "https://github.com",
      created_at: new Date().toISOString()
    }
  ]
};

/**
 * Fungsi utilitas terpusat apiCall
 * @param {string} action Nama aksi (e.g. 'getPublicData', 'login', 'sendMessage', dll)
 * @param {object} payload Data parameter yang dikirim
 * @param {string} method 'GET' atau 'POST'
 * @returns {Promise<any>}
 */
async function apiCall(action, payload = {}, method = 'POST') {
  const apiUrl = getApiUrl();

  // Jika URL belum disetel dan mencoba getPublicData, kembalikan mock data
  if (!apiUrl) {
    console.warn("⚠️ [API Warning] URL Google Apps Script belum diset. Menggunakan mock data lokal.");
    if (action === 'getPublicData') {
      await new Promise(r => setTimeout(r, 600)); // Simulasi network delay
      return { status: 'success', data: MOCK_PUBLIC_DATA, isMock: true };
    }
    if (action === 'login') {
      await new Promise(r => setTimeout(r, 500));
      if (payload.passcode === 'admin123') {
        return { status: 'success', message: 'Login demo berhasil (Passcode default: admin123)', authorized: true, isMock: true };
      }
      return { status: 'error', message: 'Passcode salah! Untuk demo gunakan: admin123', authorized: false, isMock: true };
    }
    if (action === 'getAdminData') {
      await new Promise(r => setTimeout(r, 600));
      return {
        status: 'success',
        data: {
          profile: { ...MOCK_PUBLIC_DATA.profile, Admin_Passcode: 'admin123' },
          projects: MOCK_PUBLIC_DATA.projects,
          messages: [
            {
              rowIndex: 2,
              timestamp: new Date().toLocaleString('id-ID'),
              name: 'Budi Santoso',
              email: 'budi.santoso@example.com',
              subject: 'Tawaran Proyek Website E-Commerce',
              message: 'Halo Mas Rizky, kami tertarik untuk berdiskusi tentang pembuatan platform web e-commerce custom.'
            }
          ]
        },
        isMock: true
      };
    }
    if (action === 'sendMessage') {
      await new Promise(r => setTimeout(r, 800));
      return { status: 'success', message: 'Pesan berhasil terkirim (Mode Demo Lokal)!', isMock: true };
    }
    if (action === 'addProject' || action === 'updateProject' || action === 'deleteProject' || action === 'updateProfile') {
      await new Promise(r => setTimeout(r, 700));
      return { status: 'success', message: 'Operasi berhasil disimpan (Mode Demo Lokal)!', isMock: true };
    }
  }

  try {
    let response;
    
    if (method.toUpperCase() === 'GET') {
      const url = new URL(apiUrl);
      url.searchParams.set('action', action);
      for (const key in payload) {
        if (payload[key] !== undefined && payload[key] !== null) {
          url.searchParams.set(key, payload[key]);
        }
      }

      response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors'
      });
    } else {
      // POST request
      // Penting: Google Apps Script Web App memblokir preflight OPTIONS jika menggunakan
      // Content-Type: application/json. Menggunakan text/plain;charset=utf-8 mencegah
      // preflight CORS dan dibaca via e.postData.contents di Apps Script.
      const requestBody = JSON.stringify({
        action: action,
        ...payload
      });

      response = await fetch(apiUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: requestBody
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`[API Error] Request '${action}' gagal:`, error);
    throw error;
  }
}

/**
 * ====================================================================
 * TOAST NOTIFICATION SYSTEM
 * ====================================================================
 * Menampilkan pesan feedback modern melayang (toast) dengan Tailwind CSS
 */
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto transform transition-all duration-300 translate-y-3 opacity-0 flex items-start gap-3 p-4 rounded-xl shadow-2xl border text-sm backdrop-blur-md';

  // Warna dan Icon berdasarkan tipe
  let bgClass = '';
  let borderClass = '';
  let iconHtml = '';

  if (type === 'success') {
    bgClass = 'bg-slate-900/95 text-emerald-300';
    borderClass = 'border-emerald-500/30';
    iconHtml = `<svg class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
  } else if (type === 'error') {
    bgClass = 'bg-slate-900/95 text-rose-300';
    borderClass = 'border-rose-500/30';
    iconHtml = `<svg class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
  } else if (type === 'warning') {
    bgClass = 'bg-slate-900/95 text-amber-300';
    borderClass = 'border-amber-500/30';
    iconHtml = `<svg class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
  } else {
    bgClass = 'bg-slate-900/95 text-indigo-300';
    borderClass = 'border-indigo-500/30';
    iconHtml = `<svg class="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  }

  toast.className += ` ${bgClass} ${borderClass}`;
  toast.innerHTML = `
    ${iconHtml}
    <div class="flex-1 font-medium leading-relaxed">${escapeHtml(message)}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white transition-colors shrink-0 ml-1">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  container.appendChild(toast);

  // Animasi masuk
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  // Hapus otomatis
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-3', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Helper untuk mencegah XSS pada pesan
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
