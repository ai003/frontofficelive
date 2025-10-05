import { useState, useRef } from 'react';
import type { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ProfilePicture from './ProfilePicture';
import ClickableUsername from './ClickableUsername';
import { useNavigate } from 'react-router-dom';

// Define props interface for CommentSection component
// This component manages Instagram-style flat comments with reply toggles
// DARK THEME: Uses dark:text-gray-* classes for text colors, dark:bg-gray-* for backgrounds, and dark:border-gray-* for borders throughout
interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  // Function passed down from parent to handle adding new comments
  onAddComment: (postId: string, content: string, parentId?: string | null) => void;
  // Function to trigger authentication modal when login is required
  onLoginRequired: () => void;
}

export default function CommentSection({ postId, comments, onAddComment, onLoginRequired }: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // State to track whether comments section is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(false);

  // State to track the content of the new comment being typed
  const [newComment, setNewComment] = useState('');

  // State to track which comment is currently being replied to (null = top-level comment)
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // State to track which comments have their replies visible
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Filter all comments to show only those belonging to this specific post
  const postComments = comments.filter(comment => comment.postId === postId);

  // Toggle replies visibility for a comment
  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Handle clicking Reply button - focus input and insert @username
  const handleReplyClick = async (comment: Comment) => {
    setReplyingTo(comment.id);

    // Get username - use existing or fetch from Firestore
    let username: string = comment.author.username || '';
    if (!username) {
      // Fallback for old comments without username - fetch from Firestore
      const { getUsernameById } = await import('../services/firestore');
      const fetchedUsername = await getUsernameById(comment.author.id);
      // If still no username, generate from name (remove spaces, lowercase)
      username = fetchedUsername || comment.author.name.replace(/\s+/g, '').toLowerCase();
    }

    const mention = `@${username} `;

    // Insert @mention if not already there
    if (!newComment.startsWith(mention)) {
      setNewComment(mention);
    }

    // Focus the input and scroll to it
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Helper function to render @username mentions as clickable links
  const renderContentWithMentions = (content: string) => {
    // Split content by @mentions and wrap them in clickable links
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1); // Remove @ symbol
        return (
          <button
            key={index}
            onClick={() => navigate(`/profile/${username}`)}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  // Helper function to get all descendants (replies at any level)
  const getAllDescendants = (commentId: string): Comment[] => {
    const directReplies = postComments.filter(c => c.parentId === commentId);
    const allDescendants: Comment[] = [...directReplies];

    // For each direct reply, recursively get their replies
    directReplies.forEach(reply => {
      const nestedReplies = getAllDescendants(reply.id);
      allDescendants.push(...nestedReplies);
    });

    return allDescendants;
  };

  // Flat rendering of a single comment (no recursion)
  const renderComment = (comment: Comment, isReply: boolean = false) => {
    // Find all direct replies to this comment (for display)
    const directReplies = postComments.filter(c => c.parentId === comment.id);

    // Find ALL descendants (for count) - includes replies to replies
    const allReplies = getAllDescendants(comment.id);
    const totalReplyCount = allReplies.length;
    const hasReplies = totalReplyCount > 0;
    const areRepliesExpanded = expandedReplies.has(comment.id);

    return (
      <div key={comment.id}>
        <div
          className={`py-2 ${isReply ? 'ml-8 pl-3 border-l-2 border-gray-200 dark:border-gray-600' : ''}`}
        >
          {/* Comment metadata line */}
          <div className="flex items-center gap-2 text-xs mb-1 text-gray-400 dark:text-gray-500">
            <ProfilePicture user={comment.author} size="w-4 h-4" />
            <ClickableUsername
              userId={comment.author.id}
              displayName={comment.author.name}
              className="font-medium"
            />
            <span>•</span>
            <span>{comment.createdAt.toLocaleDateString()}</span>
          </div>

          {/* Comment content with @mention highlighting */}
          <div className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 mb-2">
            {renderContentWithMentions(comment.content)}
          </div>

          {/* Action buttons: Reply and View replies (only on top-level) */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => handleReplyClick(comment)}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Reply
              </button>
            ) : (
              <button
                onClick={onLoginRequired}
                className="text-xs text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Login to Reply
              </button>
            )}

            {/* View replies toggle button - ONLY show on top-level comments */}
            {!isReply && hasReplies && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
              >
                {areRepliesExpanded ? 'Hide' : 'View'} {totalReplyCount} {totalReplyCount === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>

        {/* Flat replies - all at same indentation level */}
        {areRepliesExpanded && hasReplies && (
          <div className="ml-0">
            {directReplies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  // Get only top-level comments (those without a parent)
  const topLevelComments = postComments.filter(comment => comment.parentId === null);

  // Handle submission of new comment or reply
  const handleCommentSubmit = (e: React.FormEvent) => {
    // Prevent default form submission behavior
    e.preventDefault();

    // Only submit if comment has content after trimming whitespace
    if (newComment.trim()) {
      // Submit with parentId if replying, null for top-level comment
      onAddComment(postId, newComment.trim(), replyingTo);

      // Clear the comment input field and reset reply state
      setNewComment('');
      setReplyingTo(null);

      // Auto-expand replies if this was a reply
      if (replyingTo) {
        setExpandedReplies(prev => new Set(prev).add(replyingTo));
      }
    }
  };

  return (
    <div className="mt-2 pt-3 border-t border-gray-200 dark:border-gray-600">
      {/* Clickable header that toggles comments visibility - HN style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium hover:underline transition-colors mb-3 text-gray-600 dark:text-gray-400"
      >
        {/* Simple arrow that rotates based on expanded state */}
        <span className={`transform transition-transform text-xs ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
          ▶
        </span>
        {postComments.length === 0 ? 'Add comment' : `${postComments.length} comment${postComments.length !== 1 ? 's' : ''}`}
      </button>
      
      {/* Comments content - only visible when expanded */}
      {/* connect is expanded to state of app with auth changes */}
      {isExpanded && (
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
          {/* Render existing comments if any exist */}
          {topLevelComments.length > 0 && (
            <div className="mb-4">
              {topLevelComments.map(comment => renderComment(comment))}
            </div>
          )}
          
          {/* Single comment input at bottom - handles both top-level and replies */}
          <div
            className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
          >
            {isAuthenticated ? (
              /* Comment form for authenticated users */
              <form onSubmit={handleCommentSubmit}>
                {/* Show indicator when replying to someone */}
                {replyingTo && (() => {
                  const replyTarget = postComments.find(c => c.id === replyingTo);
                  if (!replyTarget) return null;

                  return (
                    <div className="mb-2 flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                      <span className="text-gray-500 dark:text-gray-400">
                        Replying to{' '}
                        <ClickableUsername
                          userId={replyTarget.author.id}
                          displayName={replyTarget.author.name}
                          className="font-medium"
                        />
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(null);
                          setNewComment('');
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                })()}
                <textarea
                  ref={inputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-2 text-sm rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder={replyingTo ? "Write your reply..." : "Add a comment..."}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="mt-2 px-3 py-1 text-sm rounded-lg font-medium transition-colors bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {replyingTo ? 'Reply' : 'Comment'}
                </button>
              </form>
            ) : (
              /* Login prompt for non-authenticated users */
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Join the discussion! Sign in to share your thoughts.
                </p>
                <button
                  onClick={onLoginRequired}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors"
                >
                  Login to Comment
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}