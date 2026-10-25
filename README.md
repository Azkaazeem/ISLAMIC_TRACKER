# 🕌 Namaz Tracker (ماہانہ نماز اور عبادت ٹریکر)

A clean, non-messy, responsive monthly habit and prayer tracking web application built with a **Yellow and Black** theme and pure vector SVG icons.

---

## 🌟 Key Features

1. **Clean Yellow & Black Theme (`#ffd700`, `#f59e0b`, `#09090b`)**:
   - Modern, high-contrast, uncluttered interface.
   - Clean vector SVG icons used throughout (no phone emojis).
   - Non-technical friendly with large clickable symbol boxes and clear legends.

2. **Authentication (Login & Signup)**:
   - **Signup fields**: Full Name, Email, Gender (Male / Female), Age (in years), Password, Confirm Password.
   - **Validation**: Passwords match, email format, minimum password length.
   - **Respectful & Discreet Handling**:
     - No awkward or explicit wording on public/signup screens.
     - For adult females (Age 10+), a dignified **Uzr (Excused)** status is available in their private tracker.
     - Completely absent for young children and male profiles.

3. **Prayer Tracking Symbols (Crisp Vector Icons)**:
   - **Check (Green/Gold)**: Prayed on time (`Parhi`)
   - **Circle (Amber)**: Offered late / Qaza (`Qaza`)
   - **Cross (Red)**: Missed / Not prayed (`Nahi Parhi`)
   - **Droplet (Rose)**: Uzr / Excused (`Uzr`) — visible only for eligible adult females
   - **Dash**: Not marked yet
   - **Interactive Grid**: Clicking any box cycles through valid options.
   - **Quick Actions**: "Mark Day as Uzr", "Mark All Prayed", "Clear Day".

4. **Monthly Grid View**:
   - 5 Columns for prayers: **Fajr, Dhuhr, Asr, Maghrib, Isha** (plus Tahajjud indicator).
   - 28 to 31 Rows (representing all days of the selected month).
   - Shows day number, weekday name, and highlights **Today**.
   - Previous / Next Month navigation and quick "Today" shortcut.
   - Real-time monthly statistics: Prayed count, Qaza count, Missed count, Uzr days, and Completion Score (%).

5. **Additional Spiritual Features**:
   - ⏰ **Live Prayer Timings**: Live countdown timer to next prayer, city switcher, Suhoor & Iftar times, Tahajjud window.
   - 🌙 **Roza (Fasting) Tracker**: 30-day fasting log (Fasted, Missed, Uzr, Nafl).
   - 📖 **Daily Quran Recitation Progress**: Log Juz (Para), Surah, Ayah range, and pages read towards your Khatam.
   - ✨ **Tahajjud Reminder & Log**: Daily check-in for Tahajjud and customizable target wakeup time.
   - 🕊️ **Spiritual State (Reflection)**: Select your state (Peaceful, Grateful, Anxious, Repentant, Low Iman, Hopeful) to receive comforting Quranic Ayahs, translations, and Duas.
   - 🌐 **Language Dropdown**: Instant switching between English, Urdu (اردو), Arabic (العربية), Hindi (हिन्दी), Turkish (Türkçe), French (Français), Bengali (বাংলা), and Indonesian (Bahasa Indonesia) with RTL support!

---

## 🗄️ Database

Connected to MongoDB Atlas:
- Database: `namaz_tracker`
- Cluster: `cluster0.y6qrf3a.mongodb.net`
- User: `azkaazeem804_db_user`

---

## 🚀 How to Run

### Option 1 (Double click):
Double-click `start.bat` in the project root.

### Option 2 (Command Line):
```powershell
node server.js
```
Open your browser and navigate to:
```
http://localhost:5000
```
