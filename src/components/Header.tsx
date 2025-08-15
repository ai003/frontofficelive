import { useEffect, useRef } from 'react';
import { User, ChevronDown } from 'lucide-react';
import frontOfficeLogo from '../assets/frontOfficeLogo.png';

interface HeaderProps {
  showUserDropdown: boolean;
  setShowUserDropdown: (show: boolean) => void;
}

// Header component with Hacker News-inspired blue header styling
// Displays the site logo and title in a clean, professional layout
export default function Header({ showUserDropdown, setShowUserDropdown }: HeaderProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown, setShowUserDropdown]);
  // DARK THEME: Header background color changes
  // bg-blue-500 (standard blue) -> dark:bg-blue-700 (darker blue when dark mode active)
  return (
    <header className="w-full py-3 px-4 bg-blue-500 dark:bg-blue-700">
      {/* Container to constrain header content to max-width and center it */}
      <div className="flex items-center justify-between max-w-4xl mx-auto text-white">
        <div className="flex items-center gap-1">
          {/* Logo container with fixed dimensions 
          have to edit to make betterr
          */}
          <div className="overflow-hidden rounded">
            <img 
              src={frontOfficeLogo} 
              alt="FrontOffice.live Logo" 
              className="h-full w-full object-cover"
              style={{ maxHeight: '60px', maxWidth: '60px' }}
              
            />
          </div>
        
          {/* Site title with clean typography */}
          <h1 className="text-xl font-semibold text-white">
            Front Office Live
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          
          {/* User selection area */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-white/20 rounded hover:bg-white/10 transition-colors h-12"
            >
              {/* User icon */}
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-3 h-3" />
              </div>
              
              {/* Username */}
              <span className="font-medium">Demo User</span>
              
              {/* Dropdown arrow */}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* User dropdown - temporarily disabled */}
            {showUserDropdown && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                  User switching temporarily disabled
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </header>
  );
}