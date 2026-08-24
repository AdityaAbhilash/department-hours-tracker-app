import { useState, useCallback, useEffect } from 'react';
import { getSettings, saveSettings } from '../store/db';

// Simple hook to read/write settings and re-render on change.
export function useSettings() {
  const [settings, setSettings] = useState(getSettings());

  const update = useCallback((partial) => {
    const updated = saveSettings(partial);
    setSettings(updated);
    return updated;
  }, []);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  return { settings, update };
}
