import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Timetable from './pages/Timetable';
import Exams from './pages/Exams';
import Links from './pages/Links';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

// HashRouter is used (not BrowserRouter) because the app is bundled inside the
// Android APK and served from a local file:// / capacitor:// origin with no
// server to handle deep-link routes — hash-based routing works everywhere.
export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/links" element={<Links />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
