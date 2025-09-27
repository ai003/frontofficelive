import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsernameById } from '../services/firestore';

interface ClickableUsernameProps {
  userId: string;
  displayName: string;
  className?: string;
}

/**
 * ClickableUsername component for user profile navigation
 */
export default function ClickableUsername({ userId, displayName, className = '' }: ClickableUsernameProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const fetchedUsername = await getUsernameById(userId);
        setUsername(fetchedUsername);
      } catch (error) {
        console.error('Error fetching username:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsername();
  }, [userId]);

  if (loading || !username) {
    return <span className={className}>{displayName}</span>;
  }

  return (
    <Link
      to={`/profile/${username}`}
      className={`hover:underline cursor-pointer ${className}`}
    >
      {displayName}
    </Link>
  );
}