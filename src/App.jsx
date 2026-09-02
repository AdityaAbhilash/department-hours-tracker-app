import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Timetable from './pages/Timetable';
import Exams from './pages/Exams';
import Deadlines from './pages/Deadlines';
import Capture from './pages/Capture';
import Links from './pages/Links';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import { resyncAllReminders } from './utils/notifications';

// HashRouter is used (not BrowserRouter) because the app is bundled inside the
// Android APK and served from a local file:// / capacitor:// origin with no
// server to handle deep-link routes — hash-based routing works everywhere.
export default function App() {
  useEffect(() => {
    // Android can silently drop scheduled reminders (reboot, OS alarm-store
    // resets, an earlier scheduling attempt that failed quietly). Re-arming
    // every future reminder is cheap and idempotent, so we do it both on a
    // fresh app launch and every time the app returns to the foreground —
    // resuming from the background does NOT remount this component, so the
    // 'resume' listener is what catches that second case.
    resyncAllReminders();
    let listenerHandle;
    (async () => {
      try {
        const { App: CapApp } = await import('@capacitor/app');
        listenerHandle = await CapApp.addListener('resume', () => {
          resyncAllReminders();
        });
      } catch {
        // Not running natively (e.g. `npm run dev`) — nothing to listen to.
      }
    })();
    return () => {
      listenerHandle?.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/deadlines" element={<Deadlines />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/links" element={<Links />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
