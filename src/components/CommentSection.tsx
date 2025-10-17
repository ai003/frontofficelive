import { useState, useRef, useMemo } from 'react';
import type { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ProfilePicture from './ProfilePicture';
import ClickableUsername from './ClickableUsername';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { deleteComment, getAllCommentDescendants } from '../services/firestore';
import DeleteCommentModal from './DeleteCommentModal';

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
  // Controlled expanded state from parent
  isExpanded: boolean;
}

export default function CommentSection({ postId, comments, onAddComment, onLoginRequired, isExpanded }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // State to track the content of the new comment being typed
  const [newComment, setNewComment] = useState('');

  // State to track which comment is currently being replied to (null = top-level comment)
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // State to track which comments have their replies visible
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // State for delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Filter all comments to show only those belonging to this specific post
  const postComments = comments.filter(comment => comment.postId === postId);

  /**
   * PERFORMANCE OPTIMIZATION: Memoized reply count map
   *
   * Problem: Without memoization, we recalculate descendant counts on EVERY render
   * - If 100 comments render 10 times = 1,000 recursive calculations
   *
   * Solution: Calculate all counts ONCE when comments change, store in a Map
   * - First render: Calculate 100 counts = 100 recursive calls, store in Map
   * - Next 9 renders: Just lookup from Map = O(1) instant retrieval
   * - Total: 100 calculations instead of 1,000 (10x performance improvement)
   *
   * useMemo(() => { ... }, [postComments]) means:
   * - Run the function when postComments array changes
   * - Otherwise, return the cached Map from memory
   *
   * The Map structure:
   *   Map {
   *     "comment-id-abc" => 3,  // This comment has 3 total replies (at any depth)
   *     "comment-id-def" => 0,  // This comment has no replies
   *     "comment-id-xyz" => 1,  // This comment has 1 reply
   *   }
   *
   * Memory cost: ~68 bytes per comment (36 byte ID + 8 byte number + 24 byte Map overhead)
   * For 100 comments: ~6.8 KB (negligible compared to comment data itself ~70 KB)
   */
  const replyCountMap = useMemo(() => {
    // Create a new Map to store commentId -> descendant count
    const map = new Map<string, number>();

    // Convert Comment[] to ServiceComment[] format for shared function
    const serviceComments = postComments.map(c => ({
      ...c,
      authorId: c.author.id,
      authorName: c.author.name,
      authorUsername: c.author.username || '',
      authorRole: c.author.role
    }));

    // For each comment in this post, calculate its total descendants
    postComments.forEach(comment => {
      // Use shared recursive DFS function from firestore.ts
      const descendants = getAllCommentDescendants(comment.id, serviceComments);

      // Store the count in the map (key = comment ID, value = count)
      map.set(comment.id, descendants.length);
    });

    // Return the completed map (React will cache this until postComments changes)
    return map;
  }, [postComments]); // Dependency: recalculate only when postComments array changes

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

  /**
   * Opens delete confirmation modal
   * @param commentId - ID of comment to delete
   */
  const openDeleteModal = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteModalOpen(true);
  };

  /**
   * Confirms and executes comment deletion with cascade
   * Deletes comment + all replies, updates commentCount
   */
  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;

    try {
      // Call Firebase service - cascade deletes comment + all descendants
      const deletedCount = await deleteComment(commentToDelete, postId);

      console.log(`Successfully deleted ${deletedCount} comment(s)`);
      // Real-time listener will update UI automatically
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  /**
   * Renders a single comment with Instagram-style flat reply display
   *
   * Key behaviors:
   * - Shows comment content with clickable @username mentions
   * - "Reply" button on ALL comments (top-level and replies)
   * - "View X replies" button ONLY on top-level comments that have replies
   * - When expanded, shows ALL descendants at the same indentation level (flat)
   *
   * @param comment - The comment to render
   * @param isReply - Whether this comment is a reply (affects visual styling and button visibility)
   * @param flatMode - When true, prevents recursive nesting (used for descendants)
   */
  const renderComment = (comment: Comment, isReply: boolean = false, flatMode: boolean = false) => {
    // Convert to ServiceComment format for shared descendant function
    const serviceComments = postComments.map(c => ({
      ...c,
      authorId: c.author.id,
      authorName: c.author.name,
      authorUsername: c.author.username || '',
      authorRole: c.author.role
    }));

    // Get ALL descendants (not just direct children) for true flat display
    const allDescendants = getAllCommentDescendants(comment.id, serviceComments);

    // Sort descendants by creation time for consistent chronological order
    const sortedDescendants = allDescendants.sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Get the TOTAL count of ALL descendants from our memoized Map
    const totalReplyCount = replyCountMap.get(comment.id) || 0;

    // Check if this comment has any replies to show the "View replies" button
    const hasReplies = totalReplyCount > 0;

    // Check if user has clicked to expand this comment's replies
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

          {/* Action buttons: Reply, Delete (three-dot menu), and View replies */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleReplyClick(comment)}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Reply
                </button>

                {/* Three-dot menu for delete - only show for comment author */}
                {user?.id === comment.author.id && (
                  <button
                    onClick={() => openDeleteModal(comment.id)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="More options"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                )}
              </>
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
        {/* Only render if NOT in flatMode (prevents recursive nesting) */}
        {!flatMode && areRepliesExpanded && hasReplies && (
          <div className="ml-0">
            {sortedDescendants.map(descendant => {
              // Find the original Comment object for this descendant
              const descendantComment = postComments.find(c => c.id === descendant.id);
              if (!descendantComment) return null;

              // Render each descendant with flatMode=true to prevent further nesting
              return renderComment(descendantComment, true, true);
            })}
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
    <>
      {/* Comments content - only visible when expanded */}
      {isExpanded && (
        <>
          <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
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
      </>
      )}

      {/* Delete confirmation modal */}
      <DeleteCommentModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCommentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        replyCount={commentToDelete ? replyCountMap.get(commentToDelete) || 0 : 0}
      />
    </>
  );
}