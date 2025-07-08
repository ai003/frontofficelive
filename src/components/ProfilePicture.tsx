import { useState } from 'react';
import { User } from 'lucide-react';
import type { User as UserType } from '../types';

interface ProfilePictureProps {
  user: UserType;
  /** 
   * Size classes for the profile picture. Examples:
   * - "w-4 h-4" for small comments
   * - "w-6 h-6" for post metadata  
   * - "w-8 h-8" for default/medium
   * - "w-12 h-12" for larger contexts
   */
  size?: string;
  className?: string;
}

/**
 * Reusable ProfilePicture component that displays user avatars with fallback.
 * 
 * Features:
 * - Shows user's avatar image if available
 * - Falls back to default grey User icon if no avatar or image fails to load
 * - Responsive sizing for different contexts (posts vs comments)
 * - Proper alt text and accessibility
 * 
 * Usage:
 * <ProfilePicture user={user} size="w-6 h-6" />
 * 
 * When adding real authentication later, just update user objects with 
 * real avatar URLs and everything works automatically.
 */
export default function ProfilePicture({ 
  user, 
  size = "w-8 h-8", 
  className = "" 
}: ProfilePictureProps) {
  const [imageError, setImageError] = useState(false);
  const baseClasses = `${size} rounded-full flex-shrink-0 ${className}`;
  
  // If user has an avatar URL and image hasn't errored, show the image
  if (user.avatar && !imageError) {
    return (
      <img
        src={user.avatar}
        alt={`${user.name}'s profile picture`}
        className={`${baseClasses} object-cover`}
        onError={() => setImageError(true)}
      />
    );
  }
  
  // Default grey icon fallback
  return (
    <div className={`${baseClasses} bg-gray-300 dark:bg-gray-600 flex items-center justify-center`}>
      <User className="w-3/5 h-3/5 text-gray-600 dark:text-gray-300" />
    </div>
  );
}