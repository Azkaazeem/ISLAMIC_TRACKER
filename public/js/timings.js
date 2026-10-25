// =========================================================
// PRAYER TIMINGS & LIVE DETECTION MANAGER (ALADHAN API)
// With Country & City Dynamic Dropdowns and Accurate Timezone
// =========================================================

const TimingsManager = {
  // Saved location variables (persisted in localStorage)
  selectedCountry: localStorage.getItem('namaz_country') || 'Pakistan',
  selectedCity: localStorage.getItem('namaz_city') || 'Karachi',
  currentTimezone: 'Asia/Karachi',
  cachedTimings: null,
  hijriDate: null,
  countdownInterval: null,
  currentPrayerKey: '',
  nextPrayerKey: '',

  // Comprehensive Country -> Cities Dataset
  locationData: {
    "Pakistan": [
      "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta",
      "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur", "Sargodha", "Sukkur", "Larkana",
      "Abbottabad", "Muzaffarabad", "Mirpur", "Gilgit", "Skardu", "Jhelum", "Sheikhupura",
      "Mardan", "Kasur", "Gujrat", "Rahim Yar Khan", "Sahiwal", "Okara", "Wah Cantt", "Dera Ghazi Khan",
      "Mingora", "Nawabshah", "Chiniot", "Kamoke", "Hafizabad", "Kohat", "Khanewal", "Dera Ismail Khan",
      "Turbat", "Khuzdar"
    ],
    "Saudi Arabia": [
      "Makkah", "Madinah", "Riyadh", "Jeddah", "Dammam", "Khobar", "Taif", "Tabuk",
      "Buraydah", "Abha", "Khamis Mushait", "Al Jubail", "Yanbu", "Najran", "Jizan", "Hail", "Al Hufuf"
    ],
    "United Arab Emirates": [
      "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain"
    ],
    "India": [
      "Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Lucknow",
      "Pune", "Srinagar", "Jaipur", "Bhopal", "Patna", "Agra", "Varanasi", "Surat", "Kanpur", "Nagpur", "Indore", "Chandigarh"
    ],
    "United Kingdom": [
      "London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Liverpool", "Sheffield", "Bradford", "Edinburgh", "Cardiff", "Leicester", "Luton"
    ],
    "United States": [
      "New York", "Chicago", "Houston", "Dallas", "Los Angeles", "Philadelphia", "Washington DC", "Atlanta", "Miami", "San Francisco", "Detroit", "Boston"
    ],
    "Canada": [
      "Toronto", "Mississauga", "Montreal", "Vancouver", "Calgary", "Ottawa", "Edmonton", "Winnipeg", "Hamilton", "Brampton"
    ],
    "Turkey": [
      "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Konya", "Adana", "Gaziantep", "Sanliurfa", "Trabzon"
    ],
    "Egypt": [
      "Cairo", "Alexandria", "Giza", "Port Said", "Suez", "Luxor", "Aswan", "Mansoura", "Tanta"
    ],
    "Bangladesh": [
      "Dhaka", "Chittagong", "Khulna", "Sylhet", "Rajshahi", "Comilla", "Barisal", "Rangpur", "Mymensingh"
    ],
    "Indonesia": [
      "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Palembang", "Yogyakarta", "Depok"
    ],
    "Malaysia": [
      "Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Shah Alam", "Malacca", "Kota Kinabalu", "Kuching"
    ],
    "Qatar": [
      "Doha", "Al Wakrah", "Al Khor", "Al Rayyan"
    ],
    "Kuwait": [
      "Kuwait City", "Al Ahmadi", "Hawalli", "Salmiya", "Farwaniya"
    ],
    "Oman": [
      "Muscat", "Salalah", "Seeb", "Sohar", "Nizwa"
    ],
    "Bahrain": [
      "Manama", "Riffa", "Muharraq"
    ],
    "Australia": [
      "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"
    ],
    "Germany": [
      "Berlin", "Frankfurt", "Munich", "Hamburg", "Cologne"
    ],
    "France": [
      "Paris", "Marseille", "Lyon", "Toulouse", "Nice"
    ],
    "South Africa": [
      "Johannesburg", "Cape Town", "Durban", "Pretoria"
    ],
    "Nigeria": [
      "Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt"
    ]
  },

  // Initialize Dropdowns in UI
  init() {
    this.populateCountryDropdowns();
    this.populateCityDropdowns(this.selectedCountry, this.selectedCity);
    this.fetchTimings(this.selectedCity, this.selectedCountry);
  },

  // Populate Country dropdowns (both in Top Banner and in Times tab)
  populateCountryDropdowns() {
    const countries = Object.keys(this.locationData);
    const countrySelects = [
      document.getElementById('country-select'),
      document.getElementById('times-country-select')
    ];

    countrySelects.forEach((selectEl) => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      countries.forEach((country) => {
        const opt = document.createElement('option');
        opt.value = country;
        opt.textContent = country;
        if (country === this.selectedCountry) opt.selected = true;
        selectEl.appendChild(opt);
      });
    });
  },

  // Populate City dropdowns based on selected Country
  populateCityDropdowns(country, preselectedCity = null) {
    const cities = this.locationData[country] || this.locationData["Pakistan"];
    const citySelects = [
      document.getElementById('city-select'),
      document.getElementById('times-city-select')
    ];

    let targetCity = preselectedCity || cities[0];
    if (!cities.includes(targetCity)) {
      targetCity = cities[0];
    }
    this.selectedCity = targetCity;

    citySelects.forEach((selectEl) => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      cities.forEach((city) => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        if (city === targetCity) opt.selected = true;
        selectEl.appendChild(opt);
      });
    });
  },

  // Event handler: When user selects Country from dropdown
  onCountryChange(country) {
    if (!country) return;
    this.selectedCountry = country;
    localStorage.setItem('namaz_country', country);

    // Synchronize both country select elements
    const bannerCountry = document.getElementById('country-select');
    const timesCountry = document.getElementById('times-country-select');
    if (bannerCountry) bannerCountry.value = country;
    if (timesCountry) timesCountry.value = country;

    // Populate cities for new country and auto-select primary city
    this.populateCityDropdowns(country);
    localStorage.setItem('namaz_city', this.selectedCity);

    // Fetch accurate timings from API immediately
    this.fetchTimings(this.selectedCity, this.selectedCountry);
  },

  // Event handler: When user selects City from dropdown
  onCityChange(city) {
    if (!city) return;
    this.selectedCity = city;
    localStorage.setItem('namaz_city', city);

    // Synchronize both city select elements
    const bannerCity = document.getElementById('city-select');
    const timesCity = document.getElementById('times-city-select');
    if (bannerCity) bannerCity.value = city;
    if (timesCity) timesCity.value = city;

    // Fetch accurate timings from API immediately
    this.fetchTimings(this.selectedCity, this.selectedCountry);
  },

  // Fetch timings using official Aladhan API with precise Juristic Method & School
  async fetchTimings(city = this.selectedCity, country = this.selectedCountry) {
    this.selectedCity = city;
    this.selectedCountry = country;

    // Juristic Method & School setup:
    // Pakistan, India, Bangladesh -> Method 1 (UIS Karachi), School 1 (Hanafi Asr)
    // Saudi Arabia, UAE, Gulf -> Method 4 (Umm Al-Qura), School 0 (Standard)
    // Turkey -> Method 13 (Diyanet), School 1 (Hanafi)
    // Egypt -> Method 5 (Egyptian Survey), School 0
    // North America -> Method 2 (ISNA), School 0
    // Others -> Method 3 (Muslim World League), School 0
    let method = 1;
    let school = 1; // Default to Hanafi calculation for South Asian precision

    if (['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Oman', 'Bahrain'].includes(country)) {
      method = 4;
      school = 0;
    } else if (country === 'Turkey') {
      method = 13;
      school = 1;
    } else if (country === 'Egypt') {
      method = 5;
      school = 0;
    } else if (['United States', 'Canada'].includes(country)) {
      method = 2;
      school = 0;
    } else if (['Pakistan', 'India', 'Bangladesh'].includes(country)) {
      method = 1;
      school = 1; // Hanafi Asr (Shadow 2x)
    } else {
      method = 3;
      school = 0;
    }

    try {
      const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}&school=${school}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.timings) {
          this.cachedTimings = data.data.timings;
          this.currentTimezone = data.data.meta?.timezone || 'Asia/Karachi';
          this.hijriDate = data.data.date?.hijri;

          this.renderTimingsUI();
          this.startLiveLoop();
          return;
        }
      }
    } catch (err) {
      console.warn('Aladhan API fetch error, using calculation fallback:', err);
    }

    // Reliable fallback baseline if offline
    this.cachedTimings = {
      Fajr: '05:15',
      Sunrise: '06:30',
      Dhuhr: '12:15',
      Asr: '16:15',
      Maghrib: '17:55',
      Isha: '19:15',
      Imsak: '05:05',
      Midnight: '23:45',
      Lastthird: '03:40',
    };
    this.currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi';
    this.renderTimingsUI();
    this.startLiveLoop();
  },

  // Render static prayer timings into cards
  renderTimingsUI() {
    if (!this.cachedTimings) return;
    const timings = this.cachedTimings;

    const setVal = (id, time) => {
      const el = document.getElementById(id);
      if (el) el.textContent = this.format12Hour(time);
    };

    setVal('time-fajr', timings.Fajr);
    setVal('time-sunrise', timings.Sunrise);
    setVal('time-dhuhr', timings.Dhuhr);
    setVal('time-asr', timings.Asr);
    setVal('time-maghrib', timings.Maghrib);
    setVal('time-isha', timings.Isha);
    setVal('time-suhoor', timings.Imsak || timings.Fajr);
    setVal('time-iftar', timings.Maghrib);
    setVal('time-tahajjud', timings.Lastthird || '03:40');

    // Update location badges
    const locEls = document.querySelectorAll('.dynamic-location-name');
    locEls.forEach((el) => {
      el.textContent = `${this.selectedCity}, ${this.selectedCountry}`;
    });

    // Update Hijri Date display if available
    const hijriEl = document.getElementById('current-hijri-display');
    if (hijriEl && this.hijriDate) {
      const hDay = this.hijriDate.day;
      const hMonth = this.hijriDate.month?.en || '';
      const hYear = this.hijriDate.year;
      hijriEl.textContent = `${hDay} ${hMonth} ${hYear} AH`;
    }
  },

  // 12-Hour format helper (e.g. "05:15" -> "5:15 AM")
  format12Hour(timeStr) {
    if (!timeStr) return '--:--';
    const cleanTime = timeStr.split(' ')[0];
    const [h, m] = cleanTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;

    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const mPad = m < 10 ? '0' + m : m;
    return `${h12}:${mPad} ${ampm}`;
  },

  // Live ticking loop: Exact City Clock, Current Namaz Detection & Next Prayer Countdown
  startLiveLoop() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const tick = () => {
      if (!this.cachedTimings) return;

      const now = new Date();

      // 1. Live City Local Time (Exact Timezone Format)
      let cityTimeStr = '';
      try {
        cityTimeStr = new Intl.DateTimeFormat('en-US', {
          timeZone: this.currentTimezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now);
      } catch (e) {
        cityTimeStr = now.toLocaleTimeString();
      }

      const clockEl = document.getElementById('current-city-time');
      if (clockEl) clockEl.textContent = cityTimeStr;
      const clockTabEl = document.getElementById('times-city-time');
      if (clockTabEl) clockTabEl.textContent = cityTimeStr;

      // 2. Extract city's hour, minute, second to compute seconds from midnight
      let curH = 0, curM = 0, curS = 0;
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: this.currentTimezone,
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false,
        }).formatToParts(now);

        const getPart = (type) => parseInt(parts.find((p) => p.type === type)?.value || 0, 10);
        curH = getPart('hour');
        if (curH === 24) curH = 0;
        curM = getPart('minute');
        curS = getPart('second');
      } catch (e) {
        curH = now.getHours();
        curM = now.getMinutes();
        curS = now.getSeconds();
      }

      const currentSec = curH * 3600 + curM * 60 + curS;

      // 3. Convert all prayer times to seconds from midnight
      const toSec = (str) => {
        if (!str) return 0;
        const [h, m] = str.split(' ')[0].split(':').map(Number);
        return (h || 0) * 3600 + (m || 0) * 60;
      };

      const fajrSec = toSec(this.cachedTimings.Fajr);
      const sunriseSec = toSec(this.cachedTimings.Sunrise);
      const dhuhrSec = toSec(this.cachedTimings.Dhuhr);
      const asrSec = toSec(this.cachedTimings.Asr);
      const maghribSec = toSec(this.cachedTimings.Maghrib);
      const ishaSec = toSec(this.cachedTimings.Isha);

      // 4. Determine Current Namaz, Next Prayer, and Target Countdown
      let curPrayer = '';
      let curPrayerKey = '';
      let nextPrayer = '';
      let nextPrayerKey = '';
      let targetSec = 0;

      if (currentSec >= fajrSec && currentSec < sunriseSec) {
        // Between Fajr and Sunrise
        curPrayer = 'Fajr';
        curPrayerKey = 'fajr';
        nextPrayer = 'Sunrise';
        nextPrayerKey = 'sunrise';
        targetSec = sunriseSec;
      } else if (currentSec >= sunriseSec && currentSec < dhuhrSec) {
        // Morning / Chasht (After sunrise, waiting for Dhuhr)
        curPrayer = 'Ishraq / Morning';
        curPrayerKey = 'ishraq';
        nextPrayer = 'Dhuhr';
        nextPrayerKey = 'dhuhr';
        targetSec = dhuhrSec;
      } else if (currentSec >= dhuhrSec && currentSec < asrSec) {
        // Between Dhuhr and Asr
        curPrayer = 'Dhuhr';
        curPrayerKey = 'dhuhr';
        nextPrayer = 'Asr';
        nextPrayerKey = 'asr';
        targetSec = asrSec;
      } else if (currentSec >= asrSec && currentSec < maghribSec) {
        // Between Asr and Maghrib
        curPrayer = 'Asr';
        curPrayerKey = 'asr';
        nextPrayer = 'Maghrib';
        nextPrayerKey = 'maghrib';
        targetSec = maghribSec;
      } else if (currentSec >= maghribSec && currentSec < ishaSec) {
        // Between Maghrib and Isha
        curPrayer = 'Maghrib';
        curPrayerKey = 'maghrib';
        nextPrayer = 'Isha';
        nextPrayerKey = 'isha';
        targetSec = ishaSec;
      } else {
        // Between Isha and next day's Fajr
        curPrayer = 'Isha';
        curPrayerKey = 'isha';
        nextPrayer = 'Fajr';
        nextPrayerKey = 'fajr';
        targetSec = currentSec >= ishaSec ? fajrSec + 86400 : fajrSec;
      }

      this.currentPrayerKey = curPrayerKey;
      this.nextPrayerKey = nextPrayerKey;

      // 5. Compute countdown string HH:MM:SS
      let diffSec = targetSec - currentSec;
      if (diffSec < 0) diffSec += 86400;

      const hrs = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      const pad = (n) => (n < 10 ? '0' + n : n);
      const countdownFormatted = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;

      // 6. Update Header & Banner UI elements
      const translate = (key, fallback) => {
        if (typeof I18N !== 'undefined' && I18N.t) {
          return I18N.t(key) || fallback;
        }
        return fallback;
      };

      const curPrayerNameEl = document.getElementById('current-prayer-name');
      const curPrayerTabEl = document.getElementById('times-current-prayer-name');
      if (curPrayerNameEl) {
        curPrayerNameEl.textContent = translate(curPrayerKey, curPrayer);
      }
      if (curPrayerTabEl) {
        curPrayerTabEl.textContent = translate(curPrayerKey, curPrayer);
      }

      const nextPrayerNameEl = document.getElementById('next-prayer-name');
      const nextPrayerTabEl = document.getElementById('times-next-prayer-name');
      if (nextPrayerNameEl) {
        nextPrayerNameEl.textContent = translate(nextPrayerKey, nextPrayer);
      }
      if (nextPrayerTabEl) {
        nextPrayerTabEl.textContent = translate(nextPrayerKey, nextPrayer);
      }

      const countdownEl = document.getElementById('next-prayer-countdown');
      const countdownTabEl = document.getElementById('times-next-prayer-countdown');
      if (countdownEl) countdownEl.textContent = countdownFormatted;
      if (countdownTabEl) countdownTabEl.textContent = countdownFormatted;

      // 7. Highlight the Active Prayer Card in the Times Tab
      this.highlightActivePrayerCard(curPrayerKey);
    };

    tick();
    this.countdownInterval = setInterval(tick, 1000);
  },

  // Dynamically highlight active prayer card
  highlightActivePrayerCard(prayerKey) {
    const prayerCards = {
      fajr: document.getElementById('card-fajr'),
      dhuhr: document.getElementById('card-dhuhr'),
      asr: document.getElementById('card-asr'),
      maghrib: document.getElementById('card-maghrib'),
      isha: document.getElementById('card-isha'),
      sunrise: document.getElementById('card-sunrise'),
    };

    Object.keys(prayerCards).forEach((key) => {
      const card = prayerCards[key];
      if (!card) return;
      if (key === prayerKey) {
        card.classList.add('active-prayer-card');
      } else {
        card.classList.remove('active-prayer-card');
      }
    });
  },
};

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TimingsManager.init());
} else {
  TimingsManager.init();
}
