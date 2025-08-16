import { useState } from 'react';
import type { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ProfilePicture from './ProfilePicture';
import ReplyForm from './ReplyForm';

// Define props interface for CommentSection component
// This component manages HN-style threaded comments with clean visual hierarchy
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
  // State to track whether comments section is expanded or collapsed
  // Start collapsed by default for cleaner initial view
  const [isExpanded, setIsExpanded] = useState(false);
  
  // State to track the content of the new comment being typed
  const [newComment, setNewComment] = useState('');
  
  // State to track which comment is currently being replied to
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Filter all comments to show only those belonging to this specific post
  const postComments = comments.filter(comment => comment.postId === postId);
  
  // Helper function to handle reply submission
  const handleReplySubmit = async (parentId: string, content: string) => {
    await onAddComment(postId, content, parentId);
    setReplyingTo(null); // Close reply form after submission
  };

  // Recursive function to render comments with Reddit-style threading
  const renderComment = (comment: Comment, depth = 0) => {
    // Find all direct replies to this comment
    const replies = postComments.filter(c => c.parentId === comment.id);
    
    // Calculate visual indentation (max depth of 4 for visual purposes)
    // Reduced indentation on mobile for better space usage
    const visualDepth = Math.min(depth, 4);
    const indentationPx = visualDepth * 16; // Reduced from 20px for mobile friendliness
    
    // Determine if this is a deep reply (depth 5+) that needs context indicator
    const isDeepReply = depth >= 5;
    
    // Find the parent comment for context indicator
    const parentComment = depth > 0 ? postComments.find(c => c.id === comment.parentId) : null;
    
    return (
      <div key={comment.id}>
        <div 
          className={`py-2 ${isDeepReply ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
          style={{ 
            marginLeft: `${indentationPx}px`,
            borderLeft: depth > 0 ? '2px solid #e5e7eb' : 'none',
            paddingLeft: depth > 0 ? '12px' : '0'
          }}
        >
          {/* Context indicator for deep replies (depth 5+) */}
          {isDeepReply && parentComment && (
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              ↳ Replying to <span className="font-medium">@{parentComment.author.name}</span>
            </div>
          )}
          
          {/* Comment metadata line */}
          <div className="flex items-center gap-2 text-xs mb-1 text-gray-400 dark:text-gray-500">
            <ProfilePicture user={comment.author} size="w-4 h-4" />
            <span className="font-medium">
              {comment.author.name}
            </span>
            <span>•</span>
            <span>{comment.createdAt.toLocaleDateString()}</span>
            {/* Show depth indicator for debugging (can be removed in production) */}
            {/* {depth > 0 && (
              <span className="text-xs opacity-50">Level: {depth}</span>
            )} */}
          </div>
          
          {/* Comment content */}
          <div className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 mb-2">
            {comment.content}
          </div>
          
          {/* Reply button */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {replyingTo === comment.id ? 'Cancel' : 'Reply'}
              </button>
            ) : (
              <button
                onClick={onLoginRequired}
                className="text-xs text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Login to Reply
              </button>
            )}
          </div>
          
          {/* Inline reply form */}
          {replyingTo === comment.id && (
            <ReplyForm
              parentComment={comment}
              onSubmit={handleReplySubmit}
              onCancel={() => setReplyingTo(null)}
            />
          )}
        </div>
        
        {/* Recursively render all replies */}
        {replies.map(reply => renderComment(reply, depth + 1))}
      </div>
    );
  };

  // Get only top-level comments (those without a parent)
  // Replies are rendered recursively within their parent comments
  const topLevelComments = postComments.filter(comment => comment.parentId === null);

  // Handle submission of new comment
  const handleCommentSubmit = (e: React.FormEvent) => {
    // Prevent default form submission behavior
    e.preventDefault();
    
    // Only submit if comment has content after trimming whitespace
    if (newComment.trim()) {
      // Call parent function to add comment (no parentId means it's a top-level comment)
      onAddComment(postId, newComment.trim());
      
      // Clear the comment input field after successful submission
      setNewComment('');
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
          
          {/* Authentication-aware comment form */}
          <div 
            className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
          >
            {isAuthenticated ? (
              /* Comment form for authenticated users */
              <form onSubmit={handleCommentSubmit}>
                <textarea
                  value={newComment} // Controlled input - value comes from state
                  onChange={(e) => setNewComment(e.target.value)} // Update state on every keystroke
                  className="w-full p-2 text-sm rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Add a comment..."
                />
                <button 
                  type="submit"
                  className="mt-2 px-3 py-1 text-sm rounded-sm font-medium transition-colors bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                >
                  Submit
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