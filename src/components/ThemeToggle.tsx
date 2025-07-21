import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

//PROBLEM FILE, DOES NOT WORK, CHANGE LATER

/**
 * ThemeToggle Component - Dark/Light Mode Toggle
 * 
 * CURRENT STATUS: Component logic works but CSS dark mode classes not applying
 * ISSUE: Tailwind CSS v4 generates @media (prefers-color-scheme:dark) instead of .dark class selectors
 * TODO: Fix Tailwind v4 dark mode configuration to use class-based strategy
 * 
 * HOW IT WORKS:
 * 1. Manages theme state ('light' | 'dark') in React useState
 * 2. Persists theme preference in localStorage
 * 3. Adds/removes 'dark' class on document.documentElement (<html>)
 * 4. Tailwind's dark: prefixed classes should activate when .dark class is present
 * 
 * FUNCTIONALITY VERIFIED:
 * ✅ Click handler fires correctly
 * ✅ State changes between light/dark
 * ✅ 'dark' class added/removed from <html> element
 * ✅ localStorage persistence works
 * ❌ CSS dark mode styles not applying (Tailwind v4 config issue)
 */
export default function ThemeToggle() {
  // Initialize theme state - starts as 'light', will be updated from localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // EFFECT 1: Load saved theme from localStorage on component mount
  // Runs only once when component mounts (empty dependency array)
  useEffect(() => {
    // Retrieve saved theme from browser's localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      // Update React state with saved theme preference
      setTheme(savedTheme);
    }
    // Empty dependency array [] means this runs once on mount
  }, []);

  // EFFECT 2: Apply theme changes to DOM and save to localStorage
  // Runs whenever 'theme' state changes (dependency array includes [theme])
  useEffect(() => {
    // Get reference to <html> element (document root)
    const root = document.documentElement;
    
    if (theme === 'dark') {
      // Add 'dark' class to <html> element
      // This enables all Tailwind 'dark:' prefixed classes throughout the app
      root.classList.add('dark');
    } else {
      // Remove 'dark' class from <html> element
      // This disables all Tailwind 'dark:' prefixed classes
      root.classList.remove('dark');
    }
    
    // Save current theme to localStorage for persistence across browser sessions
    localStorage.setItem('theme', theme);
    
    // This effect runs whenever 'theme' state changes
  }, [theme]);

  // TOGGLE FUNCTION: Switches between 'light' and 'dark' themes
  const toggleTheme = () => {
    // Ternary operator: if current theme is 'light', switch to 'dark', otherwise switch to 'light'
    setTheme(theme === 'light' ? 'dark' : 'light');
    // This will trigger the useEffect above to apply the new theme
  };

  return (
    <button
      onClick={toggleTheme} // Calls toggleTheme function when button is clicked
      // DARK THEME CLASSES (currently not working due to Tailwind v4 config issue):
      // - bg-gray-200 (light background) -> dark:bg-gray-700 (dark background)
      // - hover:bg-gray-300 (light hover) -> dark:hover:bg-gray-600 (dark hover)
      // - text-gray-800 (dark text on light) -> dark:text-gray-200 (light text on dark)
      className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors duration-200"
      // Accessibility: Screen readers will announce this label
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* CONDITIONAL ICON RENDERING: */}
      {/* Show Moon icon when in light mode (user can click to go to dark) */}
      {/* Show Sun icon when in dark mode (user can click to go to light) */}
      {theme === 'light' ? (
        <Moon className="w-5 h-5" /> // Moon icon for "switch to dark mode"
      ) : (
        <Sun className="w-5 h-5" />  // Sun icon for "switch to light mode"
      )}
    </button>
  );
}