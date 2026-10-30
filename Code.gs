/**
 * ====================================================================
 * WEB PROFIL INTERAKTIF & ADMIN DASHBOARD - GOOGLE APPS SCRIPT BACKEND
 * ====================================================================
 * File: Code.gs
 * Description: Backend API & Controller yang mengelola Google Sheets
 *              sebagai database dan melayani Web App frontend.
 * ====================================================================
 */

// Konfigurasi Nama Sheet
const SHEET_PROFILE = 'Profile';
const SHEET_PROJECTS = 'Projects';
const SHEET_MESSAGES = 'Messages';

/**
 * Mendapatkan referensi Spreadsheet aktif.
 * Jika script terhubung (container-bound) ke Spreadsheet, SpreadsheetApp.getActiveSpreadsheet() akan langsung bekerja.
 * Jika script standalone (dibuat terpisah di script.google.com), ganti SPREADSHEET_ID di bawah ini.
 */
function getDb() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (err) {}

  // Coba ambil dari script properties jika ada
  try {
    const propId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (propId) return SpreadsheetApp.openById(propId);
  } catch (err) {}

  // Ganti string ini jika script Anda dibuat di script.google.com (bukan dari Google Sheets)
  const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE") {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (err) {}
  }

  return null;
}

/**
 * Memastikan database dan sheet tersedia.
 * Jika sheet belum ada atau kosong, fungsi ini akan otomatis menginisialisasi
 * database sehingga user tidak perlu khawatir lupa menjalankan setupDatabase().
 */
function ensureDatabase() {
  const ss = getDb();
  if (!ss) {
    throw new Error('Spreadsheet tidak terhubung! Pastikan Apps Script ini dibuka melalui menu Extensions (Ekstensi) > Apps Script di dalam file Google Sheets Anda.');
  }

  let profileSheet = ss.getSheetByName(SHEET_PROFILE);
  let projectsSheet = ss.getSheetByName(SHEET_PROJECTS);

  // Jika salah satu sheet belum ada atau masih kosong, jalankan setup otomatis
  if (!profileSheet || !projectsSheet || profileSheet.getLastRow() <= 1) {
    setupDatabase();
  }

  return ss;
}

/**
 * FUNGSI SETUP OTOMATIS:
 * Membuat seluruh struktur sheet & data awal (seed data) secara otomatis.
 */
function setupDatabase() {
  const ss = getDb();
  if (!ss) {
    throw new Error('Gagal: Spreadsheet tidak ditemukan. Buka dari Google Sheets > Extensions > Apps Script.');
  }

  // 1. Setup Sheet "Profile" (Key-Value)
  let profileSheet = ss.getSheetByName(SHEET_PROFILE);
  if (!profileSheet) {
    profileSheet = ss.insertSheet(SHEET_PROFILE);
  }
  profileSheet.clear();
  profileSheet.getRange('A1:B1').setValues([['Key', 'Value']]).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  
  const defaultProfile = [
    ['Name', 'Ahmad Rizky Pratama'],
    ['Role', 'Full Stack Developer & Cloud Architect'],
    ['Bio', 'Software engineer berpengalaman lebih dari 4 tahun dalam membangun aplikasi web modern, scalable, dan high-performance. Berfokus pada arsitektur cloud, microservices, serta UI/UX yang memukau.'],
    ['Email', 'ahmad.rizky@example.com'],
    ['Phone', '+62 812-3456-7890'],
    ['Github', 'https://github.com'],
    ['Linkedin', 'https://linkedin.com'],
    ['Instagram', 'https://instagram.com'],
    ['Admin_Passcode', 'admin123'] // Passcode default untuk dashboard admin
  ];
  profileSheet.getRange(2, 1, defaultProfile.length, 2).setValues(defaultProfile);
  profileSheet.autoResizeColumns(1, 2);

  // 2. Setup Sheet "Projects"
  let projectsSheet = ss.getSheetByName(SHEET_PROJECTS);
  if (!projectsSheet) {
    projectsSheet = ss.insertSheet(SHEET_PROJECTS);
  }
  projectsSheet.clear();
  const projectHeaders = [['ID', 'Title', 'Description', 'Image_URL', 'Tech_Stack', 'Category', 'Project_URL', 'Created_At']];
  projectsSheet.getRange(1, 1, 1, projectHeaders[0].length).setValues(projectHeaders).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');

  const sampleProjects = [
    [
      'proj_1',
      'FinTech Smart Analytics Dashboard',
      'Platform visualisasi data keuangan real-time dengan prediksi machine learning dan integrasi payment gateway internasional.',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop',
      'Next.js, Tailwind CSS, TypeScript, Chart.js, PostgreSQL',
      'Web Development',
      'https://github.com',
      new Date().toISOString()
    ],
    [
      'proj_2',
      'OmniCommerce Mobile Experience',
      'Aplikasi belanja multi-vendor berbasis mobile dengan notifikasi push instan, tracking pesanan live, dan katalog interaktif.',
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1000&auto=format&fit=crop',
      'React Native, Redux, Node.js, GraphQL, Redis',
      'Mobile App',
      'https://github.com',
      new Date().toISOString()
    ],
    [
      'proj_3',
      'NeuralDoc - AI Document Processor',
      'Sistem otomatisasi ekstraksi invoice dan dokumen hukum berbasis OCR cerdas dan Large Language Model dengan akurasi 99.4%.',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
      'Python, FastAPI, Gemini API, PyTorch, Docker',
      'Artificial Intelligence',
      'https://github.com',
      new Date().toISOString()
    ],
    [
      'proj_4',
      'Aura UI - Modern Design System',
      'Design system komprehensif untuk startup enterprise dengan 80+ komponen siap pakai, dark mode otomatis, dan aksesibilitas WCAG AAA.',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1000&auto=format&fit=crop',
      'Figma, Storybook, Vanilla CSS, Tailwind, Webpack',
      'UI/UX Design',
      'https://github.com',
      new Date().toISOString()
    ]
  ];
  projectsSheet.getRange(2, 1, sampleProjects.length, projectHeaders[0].length).setValues(sampleProjects);
  projectsSheet.autoResizeColumns(1, projectHeaders[0].length);

  // 3. Setup Sheet "Messages"
  let messagesSheet = ss.getSheetByName(SHEET_MESSAGES);
  if (!messagesSheet) {
    messagesSheet = ss.insertSheet(SHEET_MESSAGES);
  }
  messagesSheet.clear();
  const messageHeaders = [['Timestamp', 'Name', 'Email', 'Subject', 'Message']];
  messagesSheet.getRange(1, 1, 1, messageHeaders[0].length).setValues(messageHeaders).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  
  const sampleMessages = [
    [
      new Date().toLocaleString('id-ID'),
      'Budi Santoso',
      'budi.santoso@example.com',
      'Tawaran Proyek Website E-Commerce',
      'Halo Mas Rizky, kami tertarik untuk berdiskusi tentang pembuatan platform web e-commerce custom.'
    ]
  ];
  messagesSheet.getRange(2, 1, sampleMessages.length, messageHeaders[0].length).setValues(sampleMessages);
  messagesSheet.autoResizeColumns(1, messageHeaders[0].length);

  Logger.log('✅ Setup Database Berhasil! Sheet Profile, Projects, dan Messages telah dibuat.');
  return 'Database berhasil diinisialisasi!';
}

/**
 * ====================================================================
 * HTTP GET HANDLER: doGet(e)
 * ====================================================================
 */
function doGet(e) {
  const params = e ? e.parameter : {};
  const action = params.action;
  const page = params.page;

  // Endpoint Cek Status / Ping API
  if (action === 'ping') {
    return createJsonResponse({
      status: 'success',
      message: 'Google Apps Script Web App Aktif & Terhubung!',
      timestamp: new Date().toISOString()
    });
  }

  // 1. API: getPublicData (Data publik untuk profil & portofolio pengunjung)
  if (action === 'getPublicData') {
    try {
      ensureDatabase();
      const profile = getPublicProfileData();
      const projects = getProjectsData();
      return createJsonResponse({
        status: 'success',
        data: {
          profile: profile,
          projects: projects
        }
      });
    } catch (err) {
      return createJsonResponse({ status: 'error', message: err.toString() });
    }
  }

  // 2. API: getAdminData (Khusus dashboard admin terotentikasi)
  if (action === 'getAdminData') {
    const passcode = params.passcode;
    if (!verifyAdmin(passcode)) {
      return createJsonResponse({ status: 'error', message: 'Akses Ditolak: Passcode tidak valid!' });
    }
    try {
      ensureDatabase();
      const profile = getFullProfileData();
      const projects = getProjectsData();
      const messages = getMessagesData();
      return createJsonResponse({
        status: 'success',
        data: {
          profile: profile,
          projects: projects,
          messages: messages
        }
      });
    } catch (err) {
      return createJsonResponse({ status: 'error', message: err.toString() });
    }
  }

  // 3. Render HTML Page jika script di-host langsung di Apps Script Web App
  if (page === 'admin') {
    let output;
    try {
      output = HtmlService.createHtmlOutputFromFile('admin');
    } catch (e) {
      output = HtmlService.createHtmlOutputFromFile('Admin');
    }
    return output
      .setTitle('Admin Dashboard | Web Profil')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // Halaman default: Halaman Profil Publik (index.html)
  let defaultOutput;
  try {
    defaultOutput = HtmlService.createHtmlOutputFromFile('index');
  } catch (e) {
    defaultOutput = HtmlService.createHtmlOutputFromFile('Index');
  }
  return defaultOutput
    .setTitle('Portfolio & Profile')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * ====================================================================
 * HTTP POST HANDLER: doPost(e)
 * ====================================================================
 */
function doPost(e) {
  try {
    let payload = {};

    // Deteksi format payload (JSON String di e.postData.contents atau Form Post di e.parameter)
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;

    // Routing aksi
    switch (action) {
      // 0a. Ping
      case 'ping': {
        return createJsonResponse({
          status: 'success',
          message: 'Google Apps Script Web App Aktif (POST)!',
          timestamp: new Date().toISOString()
        });
      }

      // 0b. Support getPublicData via POST (Sangat berguna jika GET diblokir firewall/CORS)
      case 'getPublicData': {
        ensureDatabase();
        const profile = getPublicProfileData();
        const projects = getProjectsData();
        return createJsonResponse({
          status: 'success',
          data: {
            profile: profile,
            projects: projects
          }
        });
      }

      // 0c. Support getAdminData via POST
      case 'getAdminData': {
        if (!verifyAdmin(payload.passcode)) {
          return createJsonResponse({ status: 'error', message: 'Akses Ditolak: Passcode tidak valid!' });
        }
        ensureDatabase();
        const profile = getFullProfileData();
        const projects = getProjectsData();
        const messages = getMessagesData();
        return createJsonResponse({
          status: 'success',
          data: {
            profile: profile,
            projects: projects,
            messages: messages
          }
        });
      }

      // 1. Authenticate Admin Login
      case 'login': {
        const inputPasscode = payload.passcode;
        if (verifyAdmin(inputPasscode)) {
          return createJsonResponse({
            status: 'success',
            message: 'Autentikasi berhasil!',
            authorized: true
          });
        } else {
          return createJsonResponse({
            status: 'error',
            message: 'Passcode salah! Silakan coba lagi.',
            authorized: false
          });
        }
      }

      // 2. Update Profile
      case 'updateProfile': {
        if (!verifyAdmin(payload.passcode)) {
          return createJsonResponse({ status: 'error', message: 'Akses Ditolak: Passcode tidak valid.' });
        }
        ensureDatabase();
        const profileData = payload.data || {};
        updateProfileInSheet(profileData);
        return createJsonResponse({
          status: 'success',
          message: 'Data profil berhasil diperbarui!'
        });
      }

      // 3. Add Project
      case 'addProject': {
        if (!verifyAdmin(payload.passcode)) {
          return createJsonResponse({ status: 'error', message: 'Akses Ditolak: Passcode tidak valid.' });
        }
        ensureDatabase();
        const newProject = payload.data || {};
        const createdProject = addProjectToSheet(newProject);
        return createJsonResponse({
          status: 'success',
          message: 'Portofolio proyek berhasil ditambahkan!',
          data: createdProject
        });
      }

      // 4. Update Project
      case 'updateProject': {
        if (!verifyAdmin(payload.passcode)) {
          return createJsonResponse({ status: 'error', message: 'Akses Ditolak: Passcode tidak valid.' });
        }
        ensureDatabase();
        const projectData = payload.data || {};
        const updated = updateProjectInSheet(projectData);
        if (updated) {
          return createJsonResponse({
            status: 'success',
            message: 'Portofolio proyek berhasil diperbarui!'
          });
        } else {
          return createJsonResponse({
            status: 'error',
            message: 'Proyek dengan ID tersebut tidak ditemukan.'
          });
        }
      }

      // 5. Delete Project
      case 'deleteProject': {
        if (!verifyAdmin(payload.passcode)) {
          return createJsonResponse({ status: 'error', message: 'Akses Ditolak: Passcode tidak valid.' });
        }
        ensureDatabase();
        const projectId = payload.id;
        const deleted = deleteProjectFromSheet(projectId);
        if (deleted) {
          return createJsonResponse({
            status: 'success',
            message: 'Portofolio proyek berhasil dihapus!'
          });
        } else {
          return createJsonResponse({
            status: 'error',
            message: 'Proyek tidak ditemukan untuk dihapus.'
          });
        }
      }

      // 6. Send Message (Public Contact Form)
      case 'sendMessage': {
        const name = (payload.name || '').trim();
        const email = (payload.email || '').trim();
        const subject = (payload.subject || '').trim();
        const message = (payload.message || '').trim();

        if (!name || !email || !message) {
          return createJsonResponse({
            status: 'error',
            message: 'Mohon isi Nama, Email, dan Pesan secara lengkap.'
          });
        }

        ensureDatabase();
        addMessageToSheet(name, email, subject, message);
        return createJsonResponse({
          status: 'success',
          message: 'Terima kasih! Pesan Anda berhasil dikirim.'
        });
      }

      // 7. Delete Message (Admin feature)
      case 'deleteMessage': {
        if (!verifyAdmin(payload.passcode)) {
          return createJsonResponse({ status: 'error', message: 'Akses Ditolak: Passcode tidak valid.' });
        }
        ensureDatabase();
        const rowIndex = parseInt(payload.rowIndex, 10);
        if (rowIndex && rowIndex >= 2) {
          const ss = getDb();
          const sheet = ss.getSheetByName(SHEET_MESSAGES);
          if (sheet && rowIndex <= sheet.getLastRow()) {
            sheet.deleteRow(rowIndex);
            return createJsonResponse({ status: 'success', message: 'Pesan berhasil dihapus!' });
          }
        }
        return createJsonResponse({ status: 'error', message: 'Gagal menghapus pesan.' });
      }

      default:
        return createJsonResponse({
          status: 'error',
          message: 'Aksi (' + action + ') tidak dikenali.'
        });
    }
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: 'Server Error: ' + err.toString()
    });
  }
}

/**
 * ====================================================================
 * HELPER FUNCTIONS (DATABASE ACCESS & UTILITIES)
 * ====================================================================
 */

/**
 * Membuat output JSON dengan MIME type yang tepat.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Verifikasi passcode admin dari sheet Profile
 */
function verifyAdmin(inputPasscode) {
  if (!inputPasscode) return false;
  const fullProfile = getFullProfileData();
  const storedPasscode = fullProfile['Admin_Passcode'] || 'admin123';
  return String(inputPasscode).trim() === String(storedPasscode).trim();
}

/**
 * Mengambil semua data profil (termasuk Admin_Passcode)
 */
function getFullProfileData() {
  const ss = getDb();
  if (!ss) return {};
  const sheet = ss.getSheetByName(SHEET_PROFILE);
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  const profile = {};
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    const val = data[i][1];
    if (key) {
      profile[String(key).trim()] = val;
    }
  }
  return profile;
}

/**
 * Mengambil data profil publik (menyembunyikan Admin_Passcode)
 */
function getPublicProfileData() {
  const profile = getFullProfileData();
  const safeProfile = { ...profile };
  delete safeProfile['Admin_Passcode'];
  return safeProfile;
}

/**
 * Memperbarui data profil di sheet Profile
 */
function updateProfileInSheet(newProfileData) {
  const ss = getDb();
  if (!ss) return;
  let sheet = ss.getSheetByName(SHEET_PROFILE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PROFILE);
    sheet.appendRow(['Key', 'Value']);
  }

  const data = sheet.getDataRange().getValues();
  const existingKeys = {};
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    if (key) {
      existingKeys[key] = i + 1; // 1-indexed row number
    }
  }

  // Update atau tambahkan key
  for (const key in newProfileData) {
    if (Object.prototype.hasOwnProperty.call(newProfileData, key)) {
      const val = newProfileData[key];
      if (existingKeys[key]) {
        sheet.getRange(existingKeys[key], 2).setValue(val);
      } else {
        sheet.appendRow([key, val]);
      }
    }
  }
}

/**
 * Mengambil seluruh data projects dari sheet Projects
 */
function getProjectsData() {
  const ss = getDb();
  if (!ss) return [];
  const sheet = ss.getSheetByName(SHEET_PROJECTS);
  if (!sheet) return [];

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const projects = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue;

    const proj = {};
    headers.forEach((header, index) => {
      let propName = header;
      if (header === 'image_url') propName = 'image_url';
      else if (header === 'tech_stack') propName = 'tech_stack';
      else if (header === 'project_url') propName = 'project_url';
      else if (header === 'created_at') propName = 'created_at';
      proj[propName] = row[index];
    });

    projects.push(proj);
  }

  // Urutkan dari project terbaru
  projects.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return projects;
}

/**
 * Menambahkan project baru ke sheet Projects
 */
function addProjectToSheet(project) {
  const ss = getDb();
  if (!ss) return null;
  let sheet = ss.getSheetByName(SHEET_PROJECTS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PROJECTS);
    sheet.appendRow(['ID', 'Title', 'Description', 'Image_URL', 'Tech_Stack', 'Category', 'Project_URL', 'Created_At']);
  }

  const id = 'proj_' + Utilities.getUuid().substring(0, 8);
  const createdAt = new Date().toISOString();

  const newRow = [
    id,
    project.title || 'Untitled Project',
    project.description || '',
    project.image_url || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop',
    project.tech_stack || '',
    project.category || 'General',
    project.project_url || '#',
    createdAt
  ];

  sheet.appendRow(newRow);

  return {
    id: id,
    title: project.title,
    description: project.description,
    image_url: project.image_url,
    tech_stack: project.tech_stack,
    category: project.category,
    project_url: project.project_url,
    created_at: createdAt
  };
}

/**
 * Memperbarui project berdasarkan ID
 */
function updateProjectInSheet(project) {
  const ss = getDb();
  if (!ss) return false;
  const sheet = ss.getSheetByName(SHEET_PROJECTS);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(project.id).trim()) {
      const rowNum = i + 1;
      if (project.title !== undefined) sheet.getRange(rowNum, 2).setValue(project.title);
      if (project.description !== undefined) sheet.getRange(rowNum, 3).setValue(project.description);
      if (project.image_url !== undefined) sheet.getRange(rowNum, 4).setValue(project.image_url);
      if (project.tech_stack !== undefined) sheet.getRange(rowNum, 5).setValue(project.tech_stack);
      if (project.category !== undefined) sheet.getRange(rowNum, 6).setValue(project.category);
      if (project.project_url !== undefined) sheet.getRange(rowNum, 7).setValue(project.project_url);
      return true;
    }
  }
  return false;
}

/**
 * Menghapus project berdasarkan ID
 */
function deleteProjectFromSheet(projectId) {
  const ss = getDb();
  if (!ss) return false;
  const sheet = ss.getSheetByName(SHEET_PROJECTS);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(projectId).trim()) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/**
 * Menambahkan pesan kontak ke sheet Messages
 */
function addMessageToSheet(name, email, subject, message) {
  const ss = getDb();
  if (!ss) return;
  let sheet = ss.getSheetByName(SHEET_MESSAGES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_MESSAGES);
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Subject', 'Message']);
  }

  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  sheet.appendRow([timestamp, name, email, subject, message]);
}

/**
 * Mengambil daftar pesan dari sheet Messages
 */
function getMessagesData() {
  const ss = getDb();
  if (!ss) return [];
  const sheet = ss.getSheetByName(SHEET_MESSAGES);
  if (!sheet) return [];

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const messages = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] && !row[1]) continue;

    messages.push({
      rowIndex: i + 1,
      timestamp: row[0] ? String(row[0]) : '',
      name: row[1] || '',
      email: row[2] || '',
      subject: row[3] || '',
      message: row[4] || ''
    });
  }

  messages.reverse();
  return messages;
}
