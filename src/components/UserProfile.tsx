import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Calendar, Award, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from './Header';
import type { FirestoreUser } from '../types/firestore';

/**
 * ProfileUser interface extends FirestoreUser with Date conversion
 *
 * FirestoreUser uses Timestamp, but we need Date objects for display.
 * Bio field is optional and may not exist in all user documents.
 */
interface ProfileUser extends Omit<FirestoreUser, 'createdAt'> {
  id: string;
  createdAt: Date;
  bio?: string;
}

/**
 * Format date for display in "Member Since" section
 * Shows month and year only (e.g., "January 2024")
 */
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(date);
};

/**
 * Calculate forum points based on activity and role
 *
 * Formula: (days since joined × 10) + 500 bonus for admins
 * Minimum 100 points to avoid showing 0 for new users
 */
const calculateForumPoints = (joinDate: Date, role: string) => {
  const now = new Date();
  const daysActive = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  let points = daysActive * 10;
  if (role === 'admin') points += 500;
  return Math.max(points, 100);
};

/**
 * UserProfile component - Complete user profile page
 *
 * Features implemented:
 * - URL routing via /profile/:username
 * - Firebase user lookup by username
 * - Profile data display (avatar, name, bio, stats)
 * - Forum points calculation
 * - Admin badge display
 * - Edit Profile button (own profile only)
 * - Full dark mode support
 * - Loading and error states
 * - Back navigation
 *
 * Access Control Note:
 * TODO: Implement different views for own vs. other user profiles
 * Currently shows same view to everyone, Edit button only shows on own profile
 *
 * Future Enhancements:
 * - Post/comment count aggregation (currently shows placeholder "--")
 * - Recent activity feed
 * - Profile editing functionality
 */
export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.username === profileUser?.username;

  useEffect(() => {
    const fetchUser = async () => {
      if (!username) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const usersQuery = query(
          collection(db, 'users'),
          where('username', '==', username)
        );

        const snapshot = await getDocs(usersQuery);

        if (snapshot.empty) {
          setError('User not found');
          setProfileUser(null);
        } else {
          const userDoc = snapshot.docs[0];
          const userData = userDoc.data() as FirestoreUser;

          setProfileUser({
            ...userData,
            id: userDoc.id,
            createdAt: userData.createdAt.toDate(),
            bio: userData.bio || ''
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  const handleEditProfile = () => {
    console.log('Edit profile clicked - to be implemented');
  };

  // Placeholder function for Header component - profile page doesn't need login modal
  const handleLoginRequired = () => {
    // No-op: profile page doesn't trigger auth modal
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onLoginRequired={handleLoginRequired} />
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onLoginRequired={handleLoginRequired} />
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const forumPoints = calculateForumPoints(profileUser.createdAt, profileUser.role);
  const displayName = `${profileUser.firstName} ${profileUser.lastName}`.trim();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Stable header - same as main forum */}
      <Header onLoginRequired={handleLoginRequired} />

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Profile Header Section */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profileUser.avatar ? (
                  <img
                    src={profileUser.avatar}
                    alt={displayName}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {displayName}
                      </h2>
                      {profileUser.role === 'admin' && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-semibold rounded">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">@{profileUser.username}</p>
                  </div>

                  {/* Edit Profile Button - Only shown on own profile */}
                  {isOwnProfile && (
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>

                {/* Bio */}
                <div className="mt-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {profileUser.bio || "This user hasn't added a bio yet."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Member Since */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member Since</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(profileUser.createdAt)}
                  </p>
                </div>
              </div>

              {/* Forum Points */}
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Forum Points</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {forumPoints.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Posts Count */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {/* TODO: Implement post count aggregation from Firebase */}
                  --
                </p>
              </div>

              {/* Comments Count */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {/* TODO: Implement comment count aggregation from Firebase */}
                  --
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TODO: Add access control logic based on viewing own vs other's profile */}
        {/* Placeholder for Activity Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Activity feed coming soon...</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Posts and comments will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}