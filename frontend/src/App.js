import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Navbar } from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Dashboard } from "./pages/Dashboard";
import { Analytics } from "./pages/Analytics";
import { History } from "./pages/History";

const DARK_MODE_KEY = "sunsafe-dark-mode";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // NOTE: reads a plain preference flag, not app data — fine for a UI
    // toggle. Any actual app data must stay in memory / the backend, since
    // artifacts/sandboxed previews of this app won't have localStorage.
    try {
      return window.localStorage?.getItem(DARK_MODE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      window.localStorage?.setItem(DARK_MODE_KEY, String(darkMode));
    } catch {
      // localStorage unavailable (e.g. private browsing) — non-fatal.
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((d) => !d);

  return (
    <ErrorBoundary>
      <div className="App min-h-screen">
        <BrowserRouter>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </div>
    </ErrorBoundary>
  );
}

export default App;
