# Department Hours Tracker — App Edition (Local Storage, No Login)

This is a standalone version of the Department Hours Tracker, rebuilt to run
entirely **on your phone with no server, no database, and no login screen**.
Everything is saved in your phone's local storage, inside the app itself.

The app opens straight to the Dashboard. Same visual style as the website
version, plus four new features: **Holidays**, **Exams**, **Timetable**, and
**Links**.

---

## What's different from the website version

- **No backend, no MongoDB, no login/register.** All data lives in the app's
  local storage on your phone.
- **Works fully offline.** No internet connection needed for any feature.
- Because there's no server database, use **Settings → Backup Data** regularly
  to save a copy of your data as a file, in case you ever reinstall the app or
  switch phones.

---

## New Features

### 1. Holiday Mode
On the Dashboard or History page, click **Mark Holiday**. Pick the date, and
the app credits the "stipulated hours" you've configured — no sign-in/sign-out
needed. Default holiday hours can be changed anytime in **Settings → Holiday
hours**, and you can also override it for a single day right in the Holiday
dialog.

### 2. Exams
A dedicated **Exams** page to log: subject/course, date, time, room number,
seat number, and notes. Automatically splits into **Upcoming** and **Past**.

### 3. Timetable
A **Timetable** page, pre-filled with your uploaded PDF schedule (M.Tech ESE,
IISc, Aug–Dec 2026) — but every entry can be edited, deleted, or added to, so
it stays useful across semesters. A **Reset to Default** button brings back
the original seeded schedule if you want to start over.

### 4. Links (by Semester)
A **Links** page to save study links (YouTube lectures, notes, anything with a
URL), organized by semester tabs (1–4). Any link can be marked **Major /
Important**, which pins it so it shows at the top of every semester tab.

---

## Part A — Getting the Code onto Your Computer

1. Unzip `department-hours-tracker-app.zip` somewhere on your computer.
2. Open the folder in VS Code (**File → Open Folder**).

If you already have a GitHub repo for this project
(`https://github.com/AdityaAbhilash/Department-hours-tracker`), you have two
options:
- **Recommended:** create a **new, separate repo** for this app version (it's
  a different app — no server, no login — so keeping it separate avoids
  confusion). Call it something like `department-hours-tracker-mobile`.
- Or replace the contents of your existing repo with this new code, if you no
  longer need the website version.

---

## Part B — Push to GitHub

In VS Code's terminal (**Terminal → New Terminal**), from the project root:

```bash
git init
git add .
git commit -m "Local-storage app edition with holidays, exams, timetable, links"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME/YOUR_REPO_NAME` with your actual GitHub repo. If you
haven't made the repo yet: go to [github.com](https://github.com) → **+ → New
repository** → name it → **Create repository** — then copy the URL it shows
you into the `git remote add origin ...` line above.

---

## Part C — How the APK Gets Built (You Don't Need Android Studio)

This project includes a file at `.github/workflows/build-apk.yml`. This is a
**GitHub Actions workflow** — a robot that automatically runs on GitHub's own
servers every time you push code. It does exactly what Android Studio would
do locally (install Node, install Java, build the app, package the APK) but
in the cloud, so **you never have to install Android Studio at all.**

Nothing to configure — it's already in the code you just pushed. As soon as
your `git push` from Part B finishes, it starts running automatically.

---

## Part D — Downloading the APK After Pushing

1. Go to your repo on GitHub in a browser.
2. Click the **Actions** tab (top menu, next to "Code", "Pull requests", etc.).
3. You'll see a workflow run called **"Build Android APK"** — click it. If it
   shows a yellow dot / spinning icon, it's still running; wait for it to turn
   into a green checkmark (usually takes 3–6 minutes).
4. Once it's green, scroll down to the **Artifacts** section at the bottom of
   that run's page.
5. Click **department-hours-tracker-apk** to download it — it comes as a
   `.zip` file containing your `app-debug.apk`.
6. Unzip it on your computer to get `app-debug.apk`.

### Installing it on your phone
1. Transfer `app-debug.apk` to your phone (email it to yourself, use Google
   Drive, a USB cable, WhatsApp to yourself — any method works).
2. On your phone, tap the file to install it.
3. Your phone will likely warn about "installing from unknown sources" since
   it's not from the Play Store — go to **Settings** on the prompt and allow
   it, then continue the install.
4. Open the app — it should go straight to the Dashboard, no login required.

---

## Part E — Making Changes Later

Any time you edit the code (add a feature, fix something):
```bash
git add .
git commit -m "Describe your change"
git push
```
That's it — pushing automatically triggers Part C again, and a fresh APK will
be waiting in the **Actions** tab a few minutes later (Part D).

---

## Data & Backups

Since everything is stored locally on your phone only:
- Go to **Settings → Backup Data** every so often — it downloads a `.json`
  file with everything (sessions, exams, timetable, links, settings).
- If you ever reinstall the app, lose your phone, or want to move to a new
  phone, use **Settings → Restore Backup** and select that saved file.
- **Clear All Data** in Settings wipes everything on the phone permanently —
  only use it if you're sure, and ideally after taking a backup first.

---

## Technology Stack

React, Vite, JavaScript, Tailwind CSS, React Router (HashRouter for APK
compatibility), Recharts, Lucide React — wrapped into a native Android app
shell using **Capacitor**. No backend, no database — `window.localStorage` is
the only data store.

---

## Project Structure

```
dht-app/
├── src/
│   ├── store/
│   │   ├── db.js              # localStorage read/write for every "table"
│   │   └── computations.js    # dashboard/week/month/statistics math
│   ├── utils/                 # dateUtils, durationUtils, formatters, id
│   ├── components/            # StatCard, ProgressCard, charts, modals...
│   ├── pages/                 # Dashboard, History, Timetable, Exams, Links,
│   │                            Statistics, Settings
│   ├── layouts/DashboardLayout.jsx
│   ├── context/ThemeContext.jsx
│   ├── App.jsx
│   └── main.jsx
├── capacitor.config.json
├── .github/workflows/build-apk.yml   # builds the APK automatically on push
└── package.json
```

---

## Testing Locally in a Browser (optional)

If you want to preview it on your computer before building the APK:
```bash
npm install
npm run dev
```
Open `http://localhost:5173`. Data is saved in your browser's local storage —
separate from the phone app's storage, since they're different environments.
