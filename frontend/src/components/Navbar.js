import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sun, Moon, Activity, BarChart3, History } from "lucide-react";
import { Button } from "./ui/button";

export const Navbar = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-card sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">SunSafe</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI Powered Protection</p>
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            <Link to="/" data-testid="nav-home">
              <Button variant={isActive("/") ? "default" : "ghost"} size="sm" className="transition-colors">
                <Activity className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>

            <Link to="/analytics" data-testid="nav-analytics">
              <Button variant={isActive("/analytics") ? "default" : "ghost"} size="sm" className="transition-colors">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>

            <Link to="/history" data-testid="nav-history">
              <Button variant={isActive("/history") ? "default" : "ghost"} size="sm" className="transition-colors">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              data-testid="theme-toggle"
              className="ml-2"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
