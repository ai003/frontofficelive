import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { X } from 'lucide-react';
import { auth, db } from '../firebase/config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Clear messages when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Clear messages when modal opens
      setSuccessMessage('');
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (activeTab === 'signup' && !name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
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
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (activeTab === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          name: name.trim(),
          email: email,
          role: 'user',
          createdAt: new Date().toISOString()
        });

        setSuccessMessage('Account created successfully! Welcome to the forum.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMessage('Login successful! Welcome back.');
      }

      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
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
        <div className="space-y-4">
          {/* Name Field (only for signup) */}
          {activeTab === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:text-white ${
                  errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:text-white ${
                errors.password ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
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

          {/* Forgot Password Link (only for login) */}
          {activeTab === 'login' && (
            <div className="text-right">
              <a
                href="#"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                onClick={(e) => e.preventDefault()}
              >
                Forgot password? (Just demo)
              </a>
            </div>
          )}

          {/* Submit Button */}
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
  );
};

export default AuthModal;