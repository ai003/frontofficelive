import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import CommentSection from './CommentSection';
import ClickableUsername from './ClickableUsername';
import ProfilePicture from './ProfilePicture';
import type { Post, Comment } from '../types';
import type { ServicePost, ServiceComment } from '../services/firestore';
import {
  getPostById,
  loadComments,
  subscribeToCommentsUpdates,
  addComment as addCommentToFirebase,
  getDisplayName
} from '../services/firestore';

/**
 * PostDetailPage component - Full post view with comments
 *
 * Features:
 * - URL routing via /post/:postId
 * - Firebase post lookup by ID
 * - Full post content display (title, author, content, tags, date)
 * - Integrated CommentSection with all comments for this post
 * - Back button to author's profile
 * - Real-time comment updates via Firebase listeners
 * - Loading and error states
 * - Full dark mode support
 * - Mobile responsive
 *
 * Navigation:
 * - Back button → /profile/:authorUsername (post author's profile)
 * - Author name click → /profile/:authorUsername
 * - @mentions in comments → /profile/:username
 */
export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Post state
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const commentsExpanded = true; // Always expanded on detail page

  // Placeholder function for Header component -- will need to delete the console log
  const handleLoginRequired = () => {
    // Could integrate auth modal here if needed
  };

  // Convert ServicePost to Post type for component usage
  const convertServicePostToPost = (servicePost: ServicePost): Post => ({
    ...servicePost,
    author: {
      id: servicePost.authorId,
      name: servicePost.authorName,
      role: servicePost.authorRole
    }
  });

  // Convert ServiceComment to Comment type for component usage
  const convertServiceCommentToComment = (serviceComment: ServiceComment): Comment => ({
    ...serviceComment,
    author: {
      id: serviceComment.authorId,
      name: serviceComment.authorName,
      username: serviceComment.authorUsername,
      role: serviceComment.authorRole
    }
  });

  // Fetch post data and author username
  useEffect(() => {
    const fetchPostData = async () => {
      if (!postId) {
        setError('Post ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch post by ID
        const postData = await getPostById(postId);

        if (!postData) {
          setError('Post not found');
          setPost(null);
          setLoading(false);
          return;
        }

        // Convert and set post
        const convertedPost = convertServicePostToPost(postData);
        setPost(convertedPost);

        // Fetch author's username for back button navigation

        setLoading(false);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
        setLoading(false);
      }
    };

    fetchPostData();
  }, [postId]);

  // Load comments and set up real-time listener
  useEffect(() => {
    let commentsUnsubscribe: (() => void) | undefined;

    const initializeComments = async () => {
      try {
        // Load initial comments
        const initialComments = await loadComments();
        setComments(initialComments.map(convertServiceCommentToComment));

        // Set up real-time listener for comment updates
        commentsUnsubscribe = subscribeToCommentsUpdates((updatedComments) => {
          setComments(updatedComments.map(convertServiceCommentToComment));
        });
      } catch (err) {
        console.error('Error loading comments:', err);
      }
    };

    initializeComments();

    // Cleanup: Stop Firebase listener when component unmounts
    return () => {
      if (commentsUnsubscribe) commentsUnsubscribe();
    };
  }, []);

  // Handler to add new comments
  const handleAddComment = async (postId: string, content: string, parentId: string | null = null) => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      await addCommentToFirebase(
        postId,
        content,
        user.id,
        getDisplayName(user),
        user.username,
        user.role as 'admin' | 'user',
        parentId
      );
      // Real-time listener will update UI automatically
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onLoginRequired={handleLoginRequired} />
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onLoginRequired={handleLoginRequired} />
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error || 'Post not found'}</p>
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

  // Filter comments for this post
  const postComments = comments.filter(c => c.postId === postId);
  const commentCount = postComments.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header onLoginRequired={handleLoginRequired} />

      {/* Post Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button - Navigate to previous page */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Post Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          {/* Post Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>

          {/* Post Metadata */}
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <ProfilePicture user={post.author} size="w-8 h-8" />
            <ClickableUsername
              userId={post.author.id}
              displayName={post.author.name}
              className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
            />
            {post.author.role === 'admin' && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-semibold rounded">
                ADMIN
              </span>
            )}
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>

          {/* Post Content */}
          <div className="prose dark:prose-invert max-w-none mb-4">
            <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Comment Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            {commentCount === 0 ? 'No comments yet' : `${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Comments
          </h2>
          <CommentSection
            postId={postId!}
            comments={comments}
            onAddComment={handleAddComment}
            onLoginRequired={handleLoginRequired}
            isExpanded={commentsExpanded}
          />
        </div>
      </div>
    </div>
  );
}
