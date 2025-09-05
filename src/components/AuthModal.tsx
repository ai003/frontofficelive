import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { X, Check, Eye, EyeOff } from 'lucide-react';
import { auth } from '../firebase/config';
import { createUser, checkUsernameExists, validateUsername } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Clear messages when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Clear messages when modal opens
      setSuccessMessage('');
      setErrors({});
      setUsernameAvailable(false);
      setUsernameChecking(false);
    }
  }, [isOpen]);

  // Live username checking with debounce
  const handleUsernameChange = async (value: string) => {
    const lowerValue = value.toLowerCase();
    setUsername(lowerValue);
    
    // Clear previous states
    setUsernameAvailable(false);
    setErrors(prev => ({ ...prev, username: '' }));
    
    // Clear previous timeout
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }
    
    // Don't check if empty or invalid format
    if (!lowerValue.trim()) {
      setUsernameChecking(false);
      return;
    }
    
    const validation = validateUsername(lowerValue);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, username: validation.error! }));
      setUsernameChecking(false);
      return;
    }
    
    // Set new timeout to check after 500ms of no typing
    const newTimeout = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const exists = await checkUsernameExists(lowerValue);
        if (exists) {
          setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
          setUsernameAvailable(false);
        } else {
          setErrors(prev => ({ ...prev, username: '' }));
          setUsernameAvailable(true);
        }
      } catch {
        setErrors(prev => ({ ...prev, username: 'Failed to check username availability' }));
        setUsernameAvailable(false);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);
    
    setUsernameCheckTimeout(newTimeout);
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    
    // Clear previous email errors
    setErrors(prev => ({ ...prev, email: '' }));
    
    // Validate email format if not empty
    if (value.trim() && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }
  };

  if (!isOpen) return null;

  const validateForm = async () => {
    const newErrors: {[key: string]: string} = {};

    if (activeTab === 'signup') {
      if (!firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      
      if (!lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      
      if (!username.trim()) {
        newErrors.username = 'Username is required';
      } else if (errors.username) {
        // If there's already an error from live checking, keep it
        newErrors.username = errors.username;
      }
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (errors.email) {
      // If there's already an error from real-time validation, keep it
      newErrors.email = errors.email;
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (activeTab === 'signup' && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (activeTab === 'signup' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (activeTab === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await createUser(
          user.uid,
          email,
          firstName,
          lastName,
          username
        );

        // Manually set user state to bypass onAuthStateChanged race condition
        setUser({
          id: user.uid,
          email: email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.toLowerCase().trim(),
          role: 'user'
        });

        setSuccessMessage('Account created successfully! Welcome to the forum.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMessage('Login successful! Welcome back.');
      }

      // Reset form
      setFirstName('');
      setLastName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsernameAvailable(false);
      setUsernameChecking(false);
      setShowPassword(false);
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout);
        setUsernameCheckTimeout(null);
      }
      
      // Close modal after successful auth
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error: unknown) {
      let errorMessage = activeTab === 'login' 
        ? 'Failed to login. Please check your credentials.' 
        : 'Failed to create account. Please try again.';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          default:
            break;
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        // Handle createUser errors
        errorMessage = (error as Error).message;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-1.5 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Tab Selector */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-1 flex mb-6">
          <button
            onClick={() => {
              setActiveTab('login');
              setSuccessMessage('');
              setErrors({});
              setEmail('');
              setPassword('');
              setShowPassword(false);
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setSuccessMessage('');
              setErrors({});
              setFirstName('');
              setLastName('');
              setUsername('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setUsernameAvailable(false);
              setUsernameChecking(false);
              setShowPassword(false);
              if (usernameCheckTimeout) {
                clearTimeout(usernameCheckTimeout);
                setUsernameCheckTimeout(null);
              }
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'signup'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Personal Information Section (only for signup) */}
          {activeTab === 'signup' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:text-white ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:text-white ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:text-white ${
                    errors.username ? 'border-red-300' : usernameAvailable ? 'border-green-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Choose a username"
                />
                {usernameChecking && (
                  <p className="text-blue-500 text-sm mt-1">Checking availability...</p>
                )}
                {usernameAvailable && !usernameChecking && !errors.username && (
                  <div className="flex items-center mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                    <p className="text-green-700 dark:text-green-400 text-sm font-medium">Username available</p>
                  </div>
                )}
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>
            </div>
          )}

          {/* Authentication Section */}
          <div className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:text-white ${
                  errors.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:text-white ${
                    errors.password ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              {/* Forgot Password Link (only for login) - moved inside password field area */}
              {activeTab === 'login' && (
                <div className="text-right mt-2">
                  <a
                    href="#"
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot password? (Just demo)
                  </a>
                </div>
              )}
            </div>

            {/* Confirm Password Field (only for signup) */}
            {activeTab === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:text-white ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-green-700 dark:text-green-400 text-sm">{successMessage}</p>
            </div>
          )}


          {/* Submit Button */}
          <div className="pt-2">
            <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full font-medium py-2 px-4 rounded-lg transition-colors ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {isLoading 
              ? (activeTab === 'login' ? 'Signing in...' : 'Creating Account...') 
              : (activeTab === 'login' ? 'Login' : 'Create Account')
            }
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;