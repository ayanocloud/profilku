/**
 * ====================================================================
 * API & UTILITY HELPER (api.js)
 * ====================================================================
 * Mengelola komunikasi HTTP Fetch ke Google Apps Script Web App,
 * validasi URL, auto-diagnosa koneksi, penanganan CORS, dan notifikasi toast.
 * ====================================================================
 */

// Ganti URL ini dengan URL Web App Google Apps Script Anda setelah di-Deploy!
// Format: https://script.google.com/macros/s/AKfycbx.../exec
const DEFAULT_GAS_API_URL = "";

/**
 * Validasi dan pembersihan URL Google Apps Script
 */
function validateAndSanitizeGasUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL tidak boleh kosong.' };
  }

  let url = rawUrl.trim().replace(/^["']|["']$/g, '');

  // 1. Cek jika pengguna memasukkan URL Spreadsheet bukan Apps Script Web App
  if (url.includes('docs.google.com/spreadsheets')) {
    return {
      valid: false,
      error: 'URL yang Anda masukkan adalah URL Google Sheets, bukan Web App URL! Buka menu Extensions > Apps Script > Deploy > New Deployment > Web app untuk menyalin URL API.'
    };
  }

  // 2. Cek jika pengguna memasukkan URL Editor script
  if (url.includes('script.google.com') && url.includes('/edit')) {
    return {
      valid: false,
      error: 'URL yang Anda masukkan adalah URL Editor Apps Script! Klik Deploy > Manage Deployments untuk mendapatkan Web App URL (.../exec).'
    };
  }

  // 3. Deteksi jika menggunakan URL /dev (yang memblokir akses publik karena butuh login Google)
  let notice = null;
  if (url.endsWith('/dev')) {
    url = url.substring(0, url.length - 4) + '/exec';
    notice = 'URL berakhiran /dev otomatis diubah menjadi /exec karena versi /dev mewajibkan login Google.';
  }

  // 4. Pastikan diawali https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // 5. Validasi domain script.google.com
  if (!url.includes('script.google.com/macros/s/')) {
    return {
      valid: false,
      error: 'Format URL tidak valid! URL Web App Google Apps Script harus berformat: https://script.google.com/macros/s/.../exec'
    };
  }

  return { valid: true, sanitizedUrl: url, notice: notice };
}

// Ambil URL tersimpan di localStorage atau gunakan default
function getApiUrl() {
  const customUrl = localStorage.getItem('gas_api_url');
  if (customUrl && customUrl.trim() !== "") {
    return customUrl.trim();
  }
  return DEFAULT_GAS_API_URL.trim();
}

// Simpan custom URL dengan sanitasi otomatis
function setApiUrl(rawUrl) {
  if (rawUrl && rawUrl.trim() !== "") {
    const res = validateAndSanitizeGasUrl(rawUrl);
    const finalUrl = res.valid ? res.sanitizedUrl : rawUrl.trim();
    localStorage.setItem('gas_api_url', finalUrl);
    return finalUrl;
  } else {
    localStorage.removeItem('gas_api_url');
    return "";
  }
}

/**
 * Data Cadangan (Mock Data) untuk preview instan
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
 * Uji Koneksi Langsung (Diagnosa Mandiri)
 * Memeriksa apakah Web App URL dapat diakses secara publik dan mengembalikan respon valid
 */
async function testGasConnection(rawUrl) {
  const check = validateAndSanitizeGasUrl(rawUrl);
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  const targetUrl = check.sanitizedUrl;

  try {
    // 1. Coba GET ping request
    const getUrl = new URL(targetUrl);
    getUrl.searchParams.set('action', 'ping');

    let response = await fetch(getUrl.toString(), {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Accept': 'application/json' }
    });

    let text = await response.text();
    let data;

    // Cek jika Google mengembalikan HTML halaman login (Akibat setelan 'Only myself')
    if (text.includes('<!DOCTYPE html') || text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
      return {
        success: false,
        error: 'Web App mewajibkan Login Google! Silakan buka Apps Script > Deploy > Manage Deployments, ubah opsi "Who has access" menjadi "Anyone" (Siapa saja).'
      };
    }

    try {
      data = JSON.parse(text);
    } catch (e) {
      // Jika GET gagal parse JSON, coba POST ping
      const postRes = await fetch(targetUrl, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' })
      });
      const postText = await postRes.text();
      data = JSON.parse(postText);
    }

    if (data && data.status === 'success') {
      return {
        success: true,
        message: 'Koneksi ke Google Apps Script Berhasil!',
        sanitizedUrl: targetUrl,
        notice: check.notice
      };
    } else {
      return {
        success: false,
        error: data.message || 'Respon dari server tidak sesuai skema.'
      };
    }
  } catch (err) {
    console.error('Koneksi test error:', err);
    return {
      success: false,
      error: 'Gagal terhubung (CORS / Network Error). Pastikan saat Deploy di Apps Script: Execute as: "Me" dan Who has access: "Anyone".'
    };
  }
}

/**
 * Fungsi utilitas terpusat apiCall
 * @param {string} action Nama aksi (e.g. 'getPublicData', 'login', 'sendMessage', dll)
 * @param {object} payload Data parameter yang dikirim
 * @param {string} method 'GET' atau 'POST'
 * @returns {Promise<any>}
 */
async function apiCall(action, payload = {}, method = 'GET') {
  const rawApiUrl = getApiUrl();

  // Jika URL belum disetel, gunakan fallback mock data
  if (!rawApiUrl) {
    if (action === 'getPublicData') {
      await new Promise(r => setTimeout(r, 400));
      return { status: 'success', data: MOCK_PUBLIC_DATA, isMock: true };
    }
    if (action === 'login') {
      await new Promise(r => setTimeout(r, 400));
      if (payload.passcode === 'admin123') {
        return { status: 'success', message: 'Login demo berhasil (Passcode: admin123)', authorized: true, isMock: true };
      }
      return { status: 'error', message: 'Passcode salah! Untuk demo gunakan: admin123', authorized: false, isMock: true };
    }
    if (action === 'getAdminData') {
      await new Promise(r => setTimeout(r, 400));
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
      await new Promise(r => setTimeout(r, 500));
      return { status: 'success', message: 'Pesan berhasil terkirim (Mode Demo Lokal)!', isMock: true };
    }
    if (action === 'addProject' || action === 'updateProject' || action === 'deleteProject' || action === 'updateProfile') {
      await new Promise(r => setTimeout(r, 500));
      return { status: 'success', message: 'Operasi berhasil disimpan (Mode Demo Lokal)!', isMock: true };
    }
  }

  // Bersihkan URL
  const valResult = validateAndSanitizeGasUrl(rawApiUrl);
  const apiUrl = valResult.valid ? valResult.sanitizedUrl : rawApiUrl;

  try {
    let response;
    
    // Strategi Permintaan:
    // Jika GET, kirim query parameter dan dukung redirect: 'follow'.
    // Jika GET gagal karena CORS/redirect issue, otomatis fallback ke POST dengan text/plain!
    if (method.toUpperCase() === 'GET') {
      try {
        const url = new URL(apiUrl);
        url.searchParams.set('action', action);
        for (const key in payload) {
          if (payload[key] !== undefined && payload[key] !== null) {
            url.searchParams.set(key, payload[key]);
          }
        }

        response = await fetch(url.toString(), {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow',
          headers: {
            'Accept': 'application/json'
          }
        });
      } catch (getErr) {
        console.warn(`[API Info] GET ${action} mengalami kendala. Mencoba fallback ke POST...`);
        // Fallback ke POST
        response = await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify({ action: action, ...payload })
        });
      }
    } else {
      // POST request
      // Menggunakan text/plain;charset=utf-8 mencegah CORS preflight OPTIONS di Apps Script
      response = await fetch(apiUrl, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action: action, ...payload })
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    // Deteksi jika Google Apps Script melempar halaman HTML (misal redirect ke login Google)
    if (text.includes('<!DOCTYPE html') || text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
      throw new Error('Google Apps Script mewajibkan Login. Pastikan opsi "Who has access" disetel ke "Anyone" pada deployment Web App Anda.');
    }

    const result = JSON.parse(text);
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
 */
function showToast(message, type = 'info', duration = 4500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto transform transition-all duration-300 translate-y-3 opacity-0 flex items-start gap-3 p-4 rounded-2xl shadow-xl border text-sm bg-white/95 backdrop-blur-md';

  let borderClass = '';
  let iconHtml = '';

  if (type === 'success') {
    borderClass = 'border-emerald-200 text-slate-800';
    iconHtml = `<svg class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
  } else if (type === 'error') {
    borderClass = 'border-rose-200 text-slate-800';
    iconHtml = `<svg class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
  } else if (type === 'warning') {
    borderClass = 'border-amber-200 text-slate-800';
    iconHtml = `<svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
  } else {
    borderClass = 'border-indigo-200 text-slate-800';
    iconHtml = `<svg class="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  }

  toast.className += ` ${borderClass}`;
  toast.innerHTML = `
    ${iconHtml}
    <div class="flex-1 font-semibold leading-relaxed">${escapeHtml(message)}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-700 transition-colors shrink-0 ml-1">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-3', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
