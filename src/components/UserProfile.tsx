import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Calendar, Edit, ChevronLeft, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import PostCard from './PostCard';
import ProfileCommentItem from './ProfileCommentItem';
import type { Post } from '../types';
import type { ServicePost, ServiceComment } from '../services/firestore';
import { getUserByUsername, getUserPosts, getUserComments, getUserStats, loadComments } from '../services/firestore';

/**
 * ProfileUser interface - User data with Date conversion
 */
interface ProfileUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
  bio?: string;
  avatar?: string;
}

/**
 * User stats interface
 */
interface UserStats {
  totalPosts: number;
  totalComments: number;
  forumPoints: number;
  joinDate: Date;
}

/**
 * Tab type for activity section
 */
type ActivityTab = 'posts' | 'comments' | 'likes';

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
 * Helper to convert ServicePost to Post for PostCard component
 */
const convertServicePostToPost = (servicePost: ServicePost): Post => ({
  ...servicePost,
  author: {
    id: servicePost.authorId,
    name: servicePost.authorName,
    role: servicePost.authorRole
  }
});

/**
 * UserProfile component - Complete user profile page
 *
 * Features:
 * - URL routing via /profile/:username
 * - Firebase user lookup by username
 * - Profile data display (avatar, name, bio, stats)
 * - Forum points calculation (posts × 10 + comments × 2)
 * - Tabbed activity system (Posts/Comments/Likes)
 * - Real user posts and comments from Firebase
 * - Back button to return to feed
 * - Admin badge display
 * - Edit Profile button (own profile only)
 * - Full dark mode support
 * - Loading and error states
 */
export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userPosts, setUserPosts] = useState<ServicePost[]>([]);
  const [userComments, setUserComments] = useState<ServiceComment[]>([]);
  const [allComments, setAllComments] = useState<ServiceComment[]>([]); // All comments for accurate counts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActivityTab>('posts');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const isOwnProfile = currentUser?.username === profileUser?.username;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user by username
        const user = await getUserByUsername(username);

        if (!user) {
          setError('User not found');
          setProfileUser(null);
          setLoading(false);
          return;
        }

        setProfileUser(user);

        // Fetch user stats, posts, comments, and ALL comments for accurate counts
        const [stats, posts, comments, allCommentsData] = await Promise.all([
          getUserStats(user.id),
          getUserPosts(user.id),
          getUserComments(user.id),
          loadComments() // Load ALL comments to calculate accurate counts
        ]);

        setUserStats(stats);
        setUserPosts(posts);
        setUserComments(comments.slice(0, 20)); // Limit to 20 most recent
        setAllComments(allCommentsData); // Store all comments for count calculation

        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user profile');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  const handleToggleComments = (postId: string) => {
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  // Calculate actual comment count for a post by counting comments
  const getCommentCount = (postId: string): number => {
    return allComments.filter(c => c.postId === postId).length;
  };

  const handleEditProfile = () => {
    console.log('Edit profile clicked - to be implemented');
  };

  // Placeholder function for Header component
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

  if (error || !profileUser || !userStats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onLoginRequired={handleLoginRequired} />
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error || 'User not found'}</p>
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

  const displayName = `${profileUser.firstName} ${profileUser.lastName}`.trim();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Stable header - same as main forum */}
      <Header onLoginRequired={handleLoginRequired} />

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Feed</span>
        </button>

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
                    {formatDate(userStats.joinDate)}
                  </p>
                </div>
              </div>

              {/* Forum Points */}
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Forum Points</p>
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                    {userStats.forumPoints.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Posts Count */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats.totalPosts}
                </p>
              </div>

              {/* Comments Count */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats.totalComments}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section with Tabs */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Tab Navigation */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'bg-blue-600 text-white'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'comments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Comments
              </button>
              <button
                disabled
                className="px-4 py-2 rounded-full text-sm font-medium bg-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed"
              >
                Likes (coming soon)
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-3">
                {userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
                  </div>
                ) : (
                  userPosts.map(post => {
                    const actualCommentCount = getCommentCount(post.id);
                    return (
                      <PostCard
                        key={post.id}
                        post={convertServicePostToPost(post)}
                        commentCount={actualCommentCount}
                        isCommentsExpanded={expandedPosts.has(post.id)}
                        onToggleComments={() => handleToggleComments(post.id)}
                      />
                    );
                  })
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-3">
                {userComments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No comments yet</p>
                  </div>
                ) : (
                  userComments.map(comment => (
                    <ProfileCommentItem key={comment.id} comment={comment} />
                  ))
                )}
              </div>
            )}

            {/* Likes Tab */}
            {activeTab === 'likes' && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Likes feature coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}