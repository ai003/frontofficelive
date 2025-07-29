import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

    if (activeTab === 'signup') {
      setIsLoading(true);
      setErrors({});

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          name: name.trim(),
          email: email,
          role: 'user',
          createdAt: new Date().toISOString()
        });

        setSuccessMessage('Account created successfully! Welcome to the forum.');
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);

      } catch (error: unknown) {
        let errorMessage = 'Failed to create account. Please try again.';
        
        if (error && typeof error === 'object' && 'code' in error) {
          const firebaseError = error as { code: string };
          if (firebaseError.code === 'auth/email-already-in-use') {
            errorMessage = 'An account with this email already exists.';
          } else if (firebaseError.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please choose a stronger password.';
          } else if (firebaseError.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
          }
        }
        
        setErrors({ submit: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBackToForum = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-200 rounded-2xl p-8 w-full max-w-md">
        {/* Tab Selector */}
        <div className="bg-gray-300 rounded-xl p-1 flex mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'signup'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Forgot Password Link (only for login) */}
          {activeTab === 'login' && (
            <div className="text-right">
              <a
                href="#"
                className="text-blue-500 hover:text-blue-600 text-sm"
                onClick={(e) => e.preventDefault()}
              >
                Forgot password?
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
            {isLoading ? 'Creating Account...' : (activeTab === 'login' ? 'Login' : 'Create Account')}
          </button>
        </div>

        {/* Back to Forum Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBackToForum}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to Forum
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;