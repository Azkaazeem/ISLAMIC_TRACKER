// =========================================================
// SWEETALERT2 THEMED HELPER & APPLICATION LOGIC
// =========================================================

const AppAlert = {
  isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  },

  theme() {
    const dark = this.isDark();
    return {
      background: dark ? '#121216' : '#ffffff',
      color: dark ? '#f4f4f5' : '#0f172a',
      confirmButtonColor: '#ffd700',
      cancelButtonColor: dark ? '#272733' : '#e2e8f0',
      customClass: {
        popup: 'swal-custom-popup',
        confirmButton: 'swal-custom-confirm',
        cancelButton: 'swal-custom-cancel',
      }
    };
  },

  success(title, text = '') {
    if (typeof Swal === 'undefined') return alert(title);
    return Swal.fire({
      ...this.theme(),
      icon: 'success',
      iconColor: '#10b981',
      title,
      text,
      confirmButtonText: (window.I18N && I18N.t('btnOk')) || 'OK',
    });
  },

  error(title, text = '') {
    if (typeof Swal === 'undefined') return alert(title + ': ' + text);
    return Swal.fire({
      ...this.theme(),
      icon: 'error',
      iconColor: '#ef4444',
      title,
      text,
      confirmButtonText: (window.I18N && I18N.t('btnOk')) || 'OK',
    });
  },

  info(title, text = '') {
    if (typeof Swal === 'undefined') return alert(title);
    return Swal.fire({
      ...this.theme(),
      icon: 'info',
      iconColor: '#ffd700',
      title,
      text,
      confirmButtonText: (window.I18N && I18N.t('btnOk')) || 'OK',
    });
  },

  confirm(title, text, confirmText, cancelText) {
    if (typeof Swal === 'undefined') return Promise.resolve({ isConfirmed: confirm(title) });
    return Swal.fire({
      ...this.theme(),
      icon: 'question',
      iconColor: '#ffd700',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText || (window.I18N && I18N.t('btnOk')) || 'Yes',
      cancelButtonText: cancelText || (window.I18N && I18N.t('btnCancel')) || 'Cancel',
      reverseButtons: true,
    });
  },

  confirmDelete(title, text) {
    if (typeof Swal === 'undefined') return Promise.resolve({ isConfirmed: confirm(title) });
    return Swal.fire({
      ...this.theme(),
      icon: 'warning',
      iconColor: '#ef4444',
      title,
      text,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: (window.I18N && I18N.t('btnDelete')) || 'Delete',
      cancelButtonText: (window.I18N && I18N.t('btnCancel')) || 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'swal-custom-popup',
        confirmButton: 'swal-custom-confirm-danger',
        cancelButton: 'swal-custom-cancel',
      }
    });
  },

  toast(title, icon = 'success') {
    if (typeof Swal === 'undefined') return;
    const dark = this.isDark();
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2400,
      timerProgressBar: true,
      background: dark ? '#181820' : '#ffffff',
      color: dark ? '#f4f4f5' : '#0f172a',
      iconColor: icon === 'success' ? '#10b981' : icon === 'error' ? '#ef4444' : '#ffd700',
      customClass: {
        popup: 'swal-custom-toast',
      }
    });
    return Toast.fire({ icon, title });
  }
};

// Main Frontend Application Logic for Namaz Tracker
const App = {
  token: localStorage.getItem('namaz_token') || null,
  user: null,

  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1, // 1 - 12
  prayerLogs: {}, // key: day -> log object
  rozaLogs: {},   // key: day -> status
  quranLogs: [],
  currentTab: 'namaz',
  currentTheme: localStorage.getItem('namaz_theme') || 'dark',

  // Curated Quranic Ayahs and Duas for Spiritual States
  moodData: {
    peaceful: {
      arabic: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      translationEn: '“Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured.”',
      translationUr: '”جو لوگ ایمان لائے اور جن کے دل اللہ کے ذکر سے سکون پاتے ہیں، سن لو! اللہ کے ذکر ہی سے دلوں کو اطمینان حاصل ہوتا ہے۔“',
      reference: 'Surah Ar-Ra’d (13:28)',
      recommendedDua: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    },
    grateful: {
      arabic: 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ ۖ وَلَئِن كَفَرْتُمْ إِنَّ عَذَابِي لَشَدِيدٌ',
      translationEn: '“And when your Lord proclaimed: If you are grateful, I will surely increase you [in favor]...”',
      translationUr: '”اور جب تمہارے رب نے آگاہ فرمایا کہ اگر تم شکر ادا کرو گے تو میں تمہیں ضرور اور زیادہ دوں گا...“',
      reference: 'Surah Ibrahim (14:7)',
      recommendedDua: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ، رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ',
    },
    anxious: {
      arabic: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
      translationEn: '“Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins.”',
      translationUr: '”فرما دیجیے: اے میرے وہ بندو جنہوں نے اپنی جانوں پر زیادتی کی ہے! اللہ کی رحمت سے مایوس نہ ہو، یقیناً اللہ تمام گناہ بخش دیتا ہے۔“',
      reference: 'Surah Az-Zumar (39:53)',
      recommendedDua: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    },
    repentant: {
      arabic: 'إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ',
      translationEn: '“Indeed, Allah loves those who are constantly repentant and loves those who purify themselves.”',
      translationUr: '”بیشک اللہ توبہ کرنے والوں کو پسند فرماتا ہے اور خوب پاکیزگی اختیار کرنے والوں کو محبوب رکھتا ہے۔“',
      reference: 'Surah Al-Baqarah (2:222)',
      recommendedDua: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
    },
    low_iman: {
      arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا',
      translationEn: '“For indeed, with hardship comes ease. Indeed, with hardship comes ease.”',
      translationUr: '”پس یقیناً مشکل کے ساتھ آسانی ہے، بے شک مشکل کے ساتھ آسانی ہے۔“',
      reference: 'Surah Ash-Sharh (94:5-6)',
      recommendedDua: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَىٰ دِينِكَ',
    },
    hopeful: {
      arabic: 'وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ',
      translationEn: '“And your Lord says: Call upon Me; I will respond to you.”',
      translationUr: '”اور تمہارے رب نے فرمایا: تم مجھ سے دعا مانگو، میں تمہاری دعا قبول کروں گا۔“',
      reference: 'Surah Ghafir (40:60)',
      recommendedDua: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    },
  },

  // Helper: Can user mark Uzr? (Only adult females aged 10+)
  isPeriodEligible() {
    return this.user && this.user.gender === 'female' && Number(this.user.age) >= 10;
  },

  // Initialize
  async init() {
    this.initTheme();
    I18N.init();

    // Setup Language Selector
    const langSelect = document.getElementById('lang-selector');
    if (langSelect) {
      langSelect.value = I18N.currentLang;
      langSelect.addEventListener('change', (e) => {
        I18N.setLanguage(e.target.value);
        this.renderAll();
      });
    }

    // Check token and verify user session
    if (this.token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (res.ok) {
          const data = await res.json();
          this.user = data.user;
          this.showApp();
          return;
        }
      } catch (err) {
        console.warn('Session verification failed, logging out.', err);
      }
      this.performSessionExpiredLogout();
    } else {
      this.showAuth('login');
    }
  },

  // ==========================================
  // THEME SWITCHER (DARK & LIGHT MODE)
  // ==========================================
  initTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    this.updateThemeIcon(this.currentTheme);
  },

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('namaz_theme', this.currentTheme);
    this.updateThemeIcon(this.currentTheme);

    // GSAP Animation on Toggle
    if (window.gsap) {
      gsap.fromTo(
        '#theme-toggle-icon',
        { rotate: -180, scale: 0.6 },
        { rotate: 0, scale: 1, duration: 0.35, ease: 'back.out(2)' }
      );
    }
  },

  updateThemeIcon(theme) {
    const iconEl = document.getElementById('theme-toggle-icon');
    if (!iconEl) return;

    if (theme === 'light') {
      // Sun Icon for Light Mode
      iconEl.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    } else {
      // Moon Icon for Dark Mode
      iconEl.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    }
  },

  // Mobile Navigation Drawer Controls
  toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const isOpen = drawer.classList.contains('open');

    if (isOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  },

  openMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (!drawer || !backdrop) return;

    drawer.classList.add('open');
    backdrop.classList.add('open');

    // Sync active mobile language select
    const mSelect = document.getElementById('lang-selector-mobile');
    if (mSelect) mSelect.value = I18N.currentLang;

    // GSAP Drawer Stagger Animation
    if (window.gsap) {
      gsap.fromTo(
        '.drawer-nav-item',
        { opacity: 0, x: 15 },
        { opacity: 1, x: 0, duration: 0.25, stagger: 0.04, ease: 'power2.out' }
      );
    }
  },

  closeMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  },

  mobileSwitchTab(tab) {
    this.switchTab(tab);
    this.closeMobileMenu();
  },

  handleMobileLangChange(lang) {
    I18N.setLanguage(lang);
    const deskSelect = document.getElementById('lang-selector');
    if (deskSelect) deskSelect.value = lang;
    this.renderAll();
  },

  // Switch Screen Views
  showAuth(mode = 'login') {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('nav-user-area').style.display = 'none';
    document.getElementById('nav-tabs').style.display = 'none';

    const mNavBox = document.getElementById('mobile-nav-links-box');
    const mUserBox = document.getElementById('mobile-user-box');
    if (mNavBox) mNavBox.style.display = 'none';
    if (mUserBox) mUserBox.style.display = 'none';

    if (mode === 'login') {
      document.getElementById('login-box').style.display = 'block';
      document.getElementById('signup-box').style.display = 'none';
    } else {
      document.getElementById('login-box').style.display = 'none';
      document.getElementById('signup-box').style.display = 'block';
    }
    I18N.applyTranslations();

    // GSAP Auth Fade In
    if (window.gsap) {
      gsap.fromTo('.auth-container', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    }
  },

  showApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('nav-user-area').style.display = 'flex';
    document.getElementById('nav-tabs').style.display = 'flex';

    // Update desktop & mobile user info
    const nameEl = document.getElementById('user-name-display');
    const avatarEl = document.getElementById('user-avatar-char');
    const mNameEl = document.getElementById('mobile-user-name');
    const mAvatarEl = document.getElementById('mobile-avatar-char');
    const mNavBox = document.getElementById('mobile-nav-links-box');
    const mUserBox = document.getElementById('mobile-user-box');

    if (nameEl) nameEl.textContent = this.user.name;
    if (avatarEl) avatarEl.textContent = this.user.name.charAt(0).toUpperCase();
    if (mNameEl) mNameEl.textContent = this.user.name;
    if (mAvatarEl) mAvatarEl.textContent = this.user.name.charAt(0).toUpperCase();
    if (mNavBox) mNavBox.style.display = 'flex';
    if (mUserBox) mUserBox.style.display = 'flex';

    // Show or hide discreet Uzr legend item
    const femaleLegend = document.getElementById('female-uzr-legend-item');
    if (femaleLegend) {
      femaleLegend.style.display = this.isPeriodEligible() ? 'flex' : 'none';
    }

    // Initialize Location and Timings Manager
    if (this.user.settings?.country) TimingsManager.selectedCountry = this.user.settings.country;
    if (this.user.settings?.city) TimingsManager.selectedCity = this.user.settings.city;
    TimingsManager.init();

    // Set Default Tab
    this.switchTab('namaz');

    // GSAP Header & App Animation
    if (window.gsap) {
      gsap.from('.navbar', { y: -25, opacity: 0, duration: 0.5, ease: 'power3.out' });
      gsap.from('.timing-banner', { scale: 0.96, opacity: 0, duration: 0.45, delay: 0.1, ease: 'power3.out' });
      gsap.from('.stat-card', { y: 16, opacity: 0, duration: 0.4, stagger: 0.05, delay: 0.15, ease: 'power3.out' });
    }
  },

  // Tab Switcher with GSAP
  switchTab(tab) {
    this.currentTab = tab;
    // Update desktop tab buttons
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    // Update mobile drawer tab buttons
    document.querySelectorAll('.drawer-nav-item').forEach((item) => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });

    document.querySelectorAll('.tab-content').forEach((panel) => {
      panel.style.display = 'none';
    });

    const activePanel = document.getElementById(`tab-${tab}`);
    if (activePanel) {
      activePanel.style.display = 'block';
      // GSAP Tab Transition (Lovable style spring)
      if (window.gsap) {
        gsap.fromTo(activePanel, { opacity: 0, y: 10, scale: 0.99 }, { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power3.out' });
      }
    }

    if (tab === 'namaz') this.loadMonthPrayers();
    if (tab === 'roza') this.loadMonthRoza();
    if (tab === 'quran') this.loadQuranData();
    if (tab === 'tahajjud') this.loadTahajjudData();
    if (tab === 'mood') this.loadMoodData();
  },

  // Month navigation
  changeMonth(delta) {
    let m = this.currentMonth + delta;
    let y = this.currentYear;
    if (m > 12) {
      m = 1;
      y++;
    } else if (m < 1) {
      m = 12;
      y--;
    }
    this.currentMonth = m;
    this.currentYear = y;
    this.loadMonthPrayers();
    if (this.currentTab === 'roza') this.loadMonthRoza();

    // GSAP Monthly Table transition
    if (window.gsap) {
      gsap.fromTo('#prayer-table-body', { opacity: 0.3, y: delta > 0 ? 8 : -8 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' });
    }
  },

  goToCurrentMonth() {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth() + 1;
    this.loadMonthPrayers();
    if (this.currentTab === 'roza') this.loadMonthRoza();
  },

  // ==========================================
  // NAMAZ TRACKER GRID
  // ==========================================
  async loadMonthPrayers() {
    this.updateMonthLabel();

    try {
      const res = await fetch(`/api/prayers/month/${this.currentYear}/${this.currentMonth}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      this.prayerLogs = {};
      if (data.logs) {
        data.logs.forEach((log) => {
          this.prayerLogs[log.day] = log;
        });
      }
      this.renderPrayerTable();
      this.loadMonthStats();
    } catch (e) {
      console.error('Failed to load prayer logs', e);
    }
  },

  async loadMonthStats() {
    try {
      const res = await fetch(`/api/prayers/stats/month/${this.currentYear}/${this.currentMonth}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      if (data.stats) {
        document.getElementById('stat-prayed-count').textContent = data.stats.prayed;
        document.getElementById('stat-qaza-count').textContent = data.stats.qaza;
        document.getElementById('stat-missed-count').textContent = data.stats.missed;
        const uzrCountEl = document.getElementById('stat-uzr-count');
        if (uzrCountEl) uzrCountEl.textContent = data.stats.period;
        document.getElementById('stat-score-percent').textContent = data.stats.scorePercentage + '%';

        // Hide Uzr card if not female eligible
        const uzrStatCard = document.getElementById('stat-card-uzr');
        if (uzrStatCard) {
          uzrStatCard.style.display = this.isPeriodEligible() ? 'flex' : 'none';
        }
      }
    } catch (e) {
      console.error('Stats error', e);
    }
  },

  updateMonthLabel() {
    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthNamesUr = [
      'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
      'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'
    ];

    const isUrdu = I18N.currentLang === 'ur' || I18N.currentLang === 'ar';
    const monthName = isUrdu ? monthNamesUr[this.currentMonth - 1] : monthNamesEn[this.currentMonth - 1];
    const label = `${monthName} ${this.currentYear}`;

    const labelEl = document.getElementById('current-month-display');
    if (labelEl) labelEl.textContent = label;
  },

  // Render Table with 5 Prayer Columns and Sticky Day Column
  renderPrayerTable() {
    const tbody = document.getElementById('prayer-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const today = new Date();
    const isCurrentYearMonth = today.getFullYear() === this.currentYear && today.getMonth() + 1 === this.currentMonth;
    const canUzr = this.isPeriodEligible();

    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentYearMonth && today.getDate() === day;
      const dayDate = new Date(this.currentYear, this.currentMonth - 1, day);
      const weekdayName = dayDate.toLocaleDateString(I18N.currentLang === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'short' });

      const log = this.prayerLogs[day] || { fajr: '', dhuhr: '', asr: '', maghrib: '', isha: '', tahajjud: '' };

      const tr = document.createElement('tr');
      if (isToday) tr.classList.add('today-row');

      // Sticky Day Column
      let dayHtml = `
        <td class="col-day">
          <div class="day-badge-col">
            <span>${day}</span>
            <span class="weekday-tag">${weekdayName}</span>
            ${isToday ? `<span class="today-chip">${I18N.t('today')}</span>` : ''}
          </div>
        </td>
      `;

      // 5 Prayer Columns (using crisp SVG vector icons)
      prayers.forEach((p) => {
        const status = log[p] || '';
        const symbolSvg = this.getStatusSymbolSvg(status);
        const statusClass = status ? `status-${status}` : 'status-empty';
        const tooltip = this.getStatusTooltip(status);

        dayHtml += `
          <td>
            <div class="prayer-box ${statusClass}" 
                 id="pbox-${day}-${p}"
                 title="${tooltip}"
                 onclick="App.cyclePrayerStatus(${day}, '${p}', event)">
              ${symbolSvg}
            </div>
          </td>
        `;
      });

      // Quick Action Buttons
      let actionHtml = `
        <td>
          <div class="row-actions">
            ${
              canUzr
                ? `<button class="btn-mini btn-mini-period" onclick="App.bulkDayAction(${day}, 'period')" title="${I18N.t('markFullDayPeriod')}">Uzr</button>`
                : ''
            }
            <button class="btn-mini" onclick="App.bulkDayAction(${day}, 'all_prayed')" title="${I18N.t('markFullDayPrayed')}">
              <svg class="mini-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <button class="btn-mini" onclick="App.bulkDayAction(${day}, 'clear_day')" title="${I18N.t('clearDay')}">
              <svg class="mini-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </td>
      `;

      tr.innerHTML = dayHtml + actionHtml;
      tbody.appendChild(tr);
    }
  },

  // Returns crisp SVG vectors instead of text emojis
  getStatusSymbolSvg(status) {
    switch (status) {
      case 'prayed':
        return `<svg class="table-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      case 'qaza':
        return `<svg class="table-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="9"></circle></svg>`;
      case 'missed':
        return `<svg class="table-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      case 'period':
        return `<svg class="table-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`;
      default:
        return `<svg class="table-svg" style="opacity:0.25;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="12" x2="18" y2="12"></line></svg>`;
    }
  },

  getStatusTooltip(status) {
    switch (status) {
      case 'prayed':
        return I18N.t('statusPrayed');
      case 'qaza':
        return I18N.t('statusQaza');
      case 'missed':
        return I18N.t('statusMissed');
      case 'period':
        return I18N.t('statusPeriod');
      default:
        return I18N.t('statusUnmarked');
    }
  },

  // Cycle Prayer Status on Box Click (With GSAP Micro-interaction)
  async cyclePrayerStatus(day, prayer, event) {
    // GSAP Tactile Box Bounce Animation
    const boxEl = event?.currentTarget || document.getElementById(`pbox-${day}-${prayer}`);
    if (window.gsap && boxEl) {
      gsap.fromTo(boxEl, { scale: 0.72, rotate: -4 }, { scale: 1, rotate: 0, duration: 0.32, ease: 'back.out(3.5)' });
    }

    const currentLog = this.prayerLogs[day] || { fajr: '', dhuhr: '', asr: '', maghrib: '', isha: '' };
    const currentStatus = currentLog[prayer] || '';

    let nextStatus = '';
    const canUzr = this.isPeriodEligible();

    // Cycling sequence:
    // empty -> prayed (✔) -> qaza (⭕) -> missed (✖) -> [Uzr (droplet) if adult female] -> empty
    if (!currentStatus) {
      nextStatus = 'prayed';
    } else if (currentStatus === 'prayed') {
      nextStatus = 'qaza';
    } else if (currentStatus === 'qaza') {
      nextStatus = 'missed';
    } else if (currentStatus === 'missed') {
      nextStatus = canUzr ? 'period' : '';
    } else if (currentStatus === 'period') {
      nextStatus = '';
    }

    // Optimistic UI update
    if (!this.prayerLogs[day]) {
      this.prayerLogs[day] = { day, year: this.currentYear, month: this.currentMonth };
    }
    this.prayerLogs[day][prayer] = nextStatus;
    this.renderPrayerTable();

    // Persist to DB
    try {
      await fetch('/api/prayers/day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          year: this.currentYear,
          month: this.currentMonth,
          day,
          [prayer]: nextStatus,
        }),
      });
      this.loadMonthStats();
    } catch (e) {
      console.error('Failed to save prayer status', e);
    }
  },

  // Bulk Day Action (Mark Day as Uzr / Mark All Prayed / Clear Day)
  async bulkDayAction(day, action) {
    try {
      const res = await fetch('/api/prayers/day-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          year: this.currentYear,
          month: this.currentMonth,
          day,
          action,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        this.prayerLogs[day] = data.log;
        this.renderPrayerTable();
        this.loadMonthStats();

        let msg = `Day ${day} updated`;
        if (action === 'all_prayed') msg = (window.I18N && I18N.t('markFullDayPrayed')) || `Day ${day}: All Prayed`;
        else if (action === 'clear_day') msg = (window.I18N && I18N.t('clearDay')) || `Day ${day} Cleared`;
        else if (action === 'period_day') msg = (window.I18N && I18N.t('markFullDayPeriod')) || `Day ${day}: Uzr`;
        AppAlert.toast(msg, 'success');
      }
    } catch (e) {
      console.error('Bulk action failed', e);
    }
  },

  // ==========================================
  // ROZA (FASTING) TRACKER
  // ==========================================
  async loadMonthRoza() {
    try {
      const res = await fetch(`/api/roza/month/${this.currentYear}/${this.currentMonth}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      this.rozaLogs = {};
      if (data.logs) {
        data.logs.forEach((log) => {
          this.rozaLogs[log.day] = log.status;
        });
      }
      this.renderRozaGrid();
    } catch (e) {
      console.error('Failed to load Roza logs', e);
    }
  },

  renderRozaGrid() {
    const grid = document.getElementById('roza-month-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
    let totalKept = 0;
    let totalMissed = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const status = this.rozaLogs[day] || '';
      if (status === 'kept' || status === 'nafl') totalKept++;
      if (status === 'missed') totalMissed++;

      const card = document.createElement('div');
      card.className = `roza-day-card ${status ? 'status-' + status : ''}`;
      card.onclick = (e) => {
        if (window.gsap) gsap.fromTo(card, { scale: 0.9 }, { scale: 1, duration: 0.2, ease: 'back.out(2)' });
        this.cycleRozaStatus(day);
      };

      let statusLabel = '—';
      if (status === 'kept') statusLabel = I18N.t('rozaKept');
      else if (status === 'missed') statusLabel = I18N.t('rozaMissed');
      else if (status === 'exempt') statusLabel = I18N.t('rozaExempt');
      else if (status === 'nafl') statusLabel = I18N.t('rozaNafl');

      card.innerHTML = `
        <div class="roza-day-num">${day}</div>
        <div class="roza-day-state">${statusLabel}</div>
      `;
      grid.appendChild(card);
    }

    const keptEl = document.getElementById('stat-roza-kept');
    const qazaEl = document.getElementById('stat-roza-qaza');
    if (keptEl) keptEl.textContent = totalKept;
    if (qazaEl) qazaEl.textContent = totalMissed;
  },

  async cycleRozaStatus(day) {
    const current = this.rozaLogs[day] || '';
    const canUzr = this.isPeriodEligible();
    // empty -> kept -> nafl -> missed -> exempt (if adult female) -> empty
    let next = '';
    if (!current) next = 'kept';
    else if (current === 'kept') next = 'nafl';
    else if (current === 'nafl') next = 'missed';
    else if (current === 'missed') next = canUzr ? 'exempt' : '';
    else if (current === 'exempt') next = '';

    this.rozaLogs[day] = next;
    this.renderRozaGrid();

    try {
      await fetch('/api/roza/day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          year: this.currentYear,
          month: this.currentMonth,
          day,
          status: next,
        }),
      });
    } catch (e) {
      console.error('Roza save error', e);
    }
  },

  // ==========================================
  // QURAN RECITATION TRACKER
  // ==========================================
  async loadQuranData() {
    try {
      const res = await fetch(`/api/quran/month/${this.currentYear}/${this.currentMonth}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      this.quranLogs = data.logs || [];

      const totalPagesEl = document.getElementById('stat-quran-pages');
      if (totalPagesEl) totalPagesEl.textContent = data.totalPages || 0;

      this.renderQuranLogs();
    } catch (e) {
      console.error('Quran data load error', e);
    }
  },

  renderQuranLogs() {
    const list = document.getElementById('quran-logs-list');
    if (!list) return;

    if (this.quranLogs.length === 0) {
      list.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:1.25rem; font-size:0.8rem;">No recitation logged yet this month. Start by logging your reading above.</p>`;
      return;
    }

    list.innerHTML = this.quranLogs
      .map(
        (item) => `
        <div class="quran-log-item">
          <div>
            <div class="quran-surah">${item.surah || 'Surah'}</div>
            <div class="quran-meta">
              ${I18N.t('day')}: ${item.day} ${this.currentMonth}/${this.currentYear} • 
              ${I18N.t('juz')}: ${item.juz} • 
              ${item.ayahRange ? `Ayat: ${item.ayahRange} • ` : ''} 
              <strong style="color:var(--yellow-main);">${item.pagesCount} ${I18N.t('pagesCount')}</strong>
            </div>
            ${item.notes ? `<div style="font-size:0.75rem; color:var(--text-dim); margin-top:0.2rem;">${item.notes}</div>` : ''}
          </div>
          <button class="btn-mini" style="color:var(--status-missed);" onclick="App.deleteQuranEntry('${item._id}')">
            <svg class="mini-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `
      )
      .join('');
  },

  async addQuranEntry(e) {
    if (e) e.preventDefault();
    const day = parseInt(document.getElementById('quran-day-input').value, 10) || new Date().getDate();
    const juz = parseInt(document.getElementById('quran-juz-input').value, 10) || 1;
    const surah = document.getElementById('quran-surah-input').value.trim();
    const ayahRange = document.getElementById('quran-ayah-input').value.trim();
    const pagesCount = parseInt(document.getElementById('quran-pages-input').value, 10) || 1;
    const notes = document.getElementById('quran-notes-input').value.trim();

    try {
      const res = await fetch('/api/quran/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          year: this.currentYear,
          month: this.currentMonth,
          day,
          juz,
          surah,
          ayahRange,
          pagesCount,
          notes,
        }),
      });

      if (res.ok) {
        document.getElementById('quran-surah-input').value = '';
        document.getElementById('quran-ayah-input').value = '';
        document.getElementById('quran-pages-input').value = '';
        document.getElementById('quran-notes-input').value = '';
        AppAlert.toast((window.I18N && I18N.t('quranLogged')) || 'Quran recitation logged successfully!', 'success');
        this.loadQuranData();
      }
    } catch (err) {
      console.error('Failed to log Quran reading', err);
      AppAlert.error('Recitation Log Error', 'Could not save your reading entry.');
    }
  },

  async deleteQuranEntry(id) {
    const title = (window.I18N && I18N.t('deleteEntryTitle')) || 'Remove Entry?';
    const text = (window.I18N && I18N.t('deleteEntryText')) || 'Are you sure you want to remove this recitation entry?';
    const res = await AppAlert.confirmDelete(title, text);
    if (!res.isConfirmed) return;

    try {
      await fetch(`/api/quran/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.token}` },
      });
      AppAlert.toast('Recitation entry removed', 'info');
      this.loadQuranData();
    } catch (e) {
      console.error(e);
    }
  },

  // ==========================================
  // TAHAJJUD REMINDER & LOG
  // ==========================================
  async loadTahajjudData() {
    const today = new Date().getDate();
    const log = this.prayerLogs[today];
    const isTodayTahajjudPrayed = log && log.tahajjud === 'prayed';

    const checkBtn = document.getElementById('tahajjud-today-btn');
    if (checkBtn) {
      if (isTodayTahajjudPrayed) {
        checkBtn.textContent = 'Tahajjud Offered Today';
        checkBtn.style.background = 'var(--status-prayed)';
        checkBtn.style.color = '#fff';
      } else {
        checkBtn.textContent = 'Mark Tahajjud Offered';
        checkBtn.style.background = 'linear-gradient(135deg, var(--yellow-main), var(--yellow-amber))';
        checkBtn.style.color = 'var(--text-dark)';
      }
    }

    const timeInput = document.getElementById('tahajjud-time-input');
    if (timeInput && this.user.settings?.tahajjudTime) {
      timeInput.value = this.user.settings.tahajjudTime;
    }
  },

  async toggleTodayTahajjud() {
    const today = new Date().getDate();
    const current = this.prayerLogs[today]?.tahajjud || '';
    const next = current === 'prayed' ? '' : 'prayed';

    try {
      await fetch('/api/prayers/day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          year: this.currentYear,
          month: this.currentMonth,
          day: today,
          tahajjud: next,
        }),
      });

      if (!this.prayerLogs[today]) this.prayerLogs[today] = { day: today };
      this.prayerLogs[today].tahajjud = next;
      this.loadTahajjudData();
    } catch (e) {
      console.error(e);
    }
  },

  async saveTahajjudTime() {
    const timeVal = document.getElementById('tahajjud-time-input').value;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          settings: { tahajjudTime: timeVal, tahajjudReminder: true },
        }),
      });
      if (res.ok) {
        const title = (window.I18N && I18N.t('tahajjudSaved')) || 'Tahajjud Target Saved';
        const msg = (window.I18N && I18N.t('tahajjudSavedText')) || 'Your target time has been updated.';
        AppAlert.success(title, msg);
      }
    } catch (e) {
      console.error(e);
      AppAlert.error('Tahajjud Setting Error', 'Could not save your Tahajjud target time.');
    }
  },

  // ==========================================
  // SPIRITUAL MOOD CHANGER
  // ==========================================
  async loadMoodData() {
    try {
      const res = await fetch('/api/mood/today', {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      if (data.log && data.log.mood) {
        this.selectMood(data.log.mood, false);
      } else {
        this.selectMood('peaceful', false);
      }
    } catch (e) {
      this.selectMood('peaceful', false);
    }
  },

  selectMood(moodKey, persist = true) {
    document.querySelectorAll('.mood-card').forEach((card) => {
      card.classList.toggle('selected', card.getAttribute('data-mood') === moodKey);
    });

    const info = this.moodData[moodKey];
    if (info) {
      document.getElementById('ayah-arabic-text').textContent = info.arabic;
      document.getElementById('ayah-trans-text').textContent =
        I18N.currentLang === 'ur' ? info.translationUr : info.translationEn;
      document.getElementById('ayah-ref-text').textContent = info.reference;
      document.getElementById('recommended-dua-text').textContent = info.recommendedDua;

      // GSAP Ayah Box Highlight
      if (window.gsap) {
        gsap.fromTo('.ayah-quote-box', { opacity: 0.6, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
      }
    }

    if (persist) {
      fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ mood: moodKey }),
      })
        .then(() => {
          AppAlert.toast((window.I18N && I18N.t('moodSaved')) || 'Spiritual reflection saved.', 'success');
        })
        .catch(console.error);
    }
  },

  // ==========================================
  // AUTHENTICATION LOGIC
  // ==========================================
  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const alertEl = document.getElementById('login-alert');

    alertEl.style.display = 'none';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alertEl.textContent = data.error || 'Login failed.';
        alertEl.className = 'alert-box alert-error';
        alertEl.style.display = 'block';
        AppAlert.error((window.I18N && I18N.t('loginFailed')) || 'Sign In Failed', data.error || 'Invalid credentials');
        return;
      }

      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('namaz_token', data.token);
      this.showApp();
      AppAlert.toast((window.I18N && I18N.t('welcomeBack')) || 'Welcome Back!', 'success');
    } catch (err) {
      alertEl.textContent = 'Server connection error. Please try again.';
      alertEl.className = 'alert-box alert-error';
      alertEl.style.display = 'block';
      AppAlert.error('Connection Error', 'Could not connect to the server. Please check your network.');
    }
  },

  async handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const gender = document.getElementById('signup-gender').value;
    const age = parseInt(document.getElementById('signup-age').value, 10);
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const alertEl = document.getElementById('signup-alert');

    alertEl.style.display = 'none';

    // Validation
    if (!name || !email || !gender || isNaN(age) || !password) {
      alertEl.textContent = 'Please fill out all fields.';
      alertEl.className = 'alert-box alert-error';
      alertEl.style.display = 'block';
      AppAlert.error('Validation Error', 'Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      alertEl.textContent = 'Password must be at least 6 characters.';
      alertEl.className = 'alert-box alert-error';
      alertEl.style.display = 'block';
      AppAlert.error('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      alertEl.textContent = 'Passwords do not match.';
      alertEl.className = 'alert-box alert-error';
      alertEl.style.display = 'block';
      AppAlert.error('Password Mismatch', (window.I18N && I18N.t('passwordMismatch')) || 'Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, gender, age, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        alertEl.textContent = data.error || 'Signup failed.';
        alertEl.className = 'alert-box alert-error';
        alertEl.style.display = 'block';
        AppAlert.error((window.I18N && I18N.t('signupFailed')) || 'Sign Up Failed', data.error || 'Could not create account');
        return;
      }

      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('namaz_token', data.token);
      this.showApp();
      AppAlert.success((window.I18N && I18N.t('welcomeBack')) || 'Account Created!', 'Welcome to Namaz Tracker.');
    } catch (err) {
      alertEl.textContent = 'Server connection error. Please try again.';
      alertEl.className = 'alert-box alert-error';
      alertEl.style.display = 'block';
      AppAlert.error('Connection Error', 'Could not connect to the server.');
    }
  },

  async logout() {
    const title = (window.I18N && I18N.t('logoutConfirmTitle')) || 'Sign Out?';
    const text = (window.I18N && I18N.t('logoutConfirmText')) || 'Are you sure you want to sign out of your account?';
    const confirmBtn = (window.I18N && I18N.t('logoutConfirmBtn')) || 'Yes, Sign Out';
    const cancelBtn = (window.I18N && I18N.t('btnCancel')) || 'Cancel';

    if (typeof Swal !== 'undefined') {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const result = await Swal.fire({
        title,
        text,
        icon: 'warning',
        iconColor: '#f59e0b',
        showCancelButton: true,
        confirmButtonText: confirmBtn,
        cancelButtonText: cancelBtn,
        reverseButtons: true,
        background: isDark ? '#121216' : '#ffffff',
        color: isDark ? '#f4f4f5' : '#0f172a',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: isDark ? '#272733' : '#e2e8f0',
        customClass: {
          popup: 'swal-custom-popup',
          confirmButton: 'swal-custom-confirm-danger',
          cancelButton: 'swal-custom-cancel',
        }
      });
      if (!result.isConfirmed) return;
    }

    this.performSessionExpiredLogout();
    AppAlert.toast((window.I18N && I18N.t('signedOutSuccess')) || 'Signed out successfully.', 'info');
  },

  performSessionExpiredLogout() {
    localStorage.removeItem('namaz_token');
    this.token = null;
    this.user = null;
    this.closeMobileMenu();
    this.showAuth('login');
  },

  renderAll() {
    I18N.applyTranslations();
    if (this.user) {
      this.updateMonthLabel();
      this.renderPrayerTable();
      if (this.currentTab === 'roza') this.renderRozaGrid();
      if (this.currentTab === 'quran') this.renderQuranLogs();
    }
  },
};

// Bootstrap application on page load
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
