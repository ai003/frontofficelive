import { useState } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDisplayName } from '../services/firestore';
import frontOfficeLogo from '../assets/frontOfficeLogo.png';

interface HeaderProps {
  onLoginRequired: () => void;
}

// Header component with Hacker News-inspired blue header styling
// Displays the site logo and title with real authenticated user information
export default function Header({ onLoginRequired }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Handle user logout
  const handleLogout = async () => {
    try {
      setShowUserDropdown(false);
      await logout();
      // AuthContext logout method will show loading spinner and handle state change
    } catch (error) {
      console.error('Error signing out:', error);
      // Could add error toast here in the future
    }
  };
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
          {isAuthenticated && user ? (
            /* Authenticated user display with dropdown */
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-3 py-3 border border-white/20 rounded hover:bg-white/10 transition-colors"
              >
                {/* User icon */}
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                
                {/* Real user name and role indicator */}
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm truncate max-w-32" title={getDisplayName(user)}>
                    {getDisplayName(user)}
                  </span>
                  
                </div>
                
                {/* Dropdown arrow */}
                <ChevronDown className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* User dropdown with logout */}
              {showUserDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate" title={getDisplayName(user)}>
                        {getDisplayName(user)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Non-authenticated user login button */
            <button
              onClick={onLoginRequired}
              className="px-4 py-2 bg-white text-blue-500 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </div>
    </header>
  );
}