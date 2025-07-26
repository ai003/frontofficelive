import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronDown } from 'lucide-react';
import type { User as UserType } from '../App';
import { AVAILABLE_USERS } from '../App';
import frontOfficeLogo from '../assets/frontOfficeLogo.png';

interface HeaderProps {
  selectedUser: UserType;
  showUserDropdown: boolean;
  setShowUserDropdown: (show: boolean) => void;
  onSelectUser: (user: UserType) => void;
}

// Header component with Hacker News-inspired blue header styling
// Displays the site logo and title in a clean, professional layout
export default function Header({ selectedUser, showUserDropdown, setShowUserDropdown, onSelectUser }: HeaderProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
          {/* Login/Sign Up button */}
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 border border-white/20 rounded hover:bg-white/10 transition-colors text-sm font-medium h-12"
          >
            Login / Sign Up
          </button>
          
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
              <span className="font-medium">{selectedUser.name}</span>
              
              {/* Dropdown arrow */}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* User dropdown */}
            {showUserDropdown && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                {AVAILABLE_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedUser.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    {/* User icon */}
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    
                    {/* User info */}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.role} • {user.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </header>
  );
}