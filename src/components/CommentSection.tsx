import { useState } from 'react';
import type { Comment } from '../types';

// Define props interface for CommentSection component
// This component manages HN-style threaded comments with clean visual hierarchy
interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  // Function passed down from parent to handle adding new comments
  onAddComment: (postId: string, content: string, parentId?: string | null) => void;
}

export default function CommentSection({ postId, comments, onAddComment }: CommentSectionProps) {
  // State to track whether comments section is expanded or collapsed
  // Start collapsed by default for cleaner initial view
  const [isExpanded, setIsExpanded] = useState(false);
  
  // State to track the content of the new comment being typed
  const [newComment, setNewComment] = useState('');

  // Filter all comments to show only those belonging to this specific post
  const postComments = comments.filter(comment => comment.postId === postId);
  
  // Recursive function to render comments and their nested replies
  // Uses HN-style indentation with subtle borders for visual hierarchy
  const renderComment = (comment: Comment, depth = 0) => {
    // Find all direct replies to this comment
    const replies = postComments.filter(c => c.parentId === comment.id);
    
    return (
      <div key={comment.id} className={depth > 0 ? 'ml-4' : ''}>
        {/* Individual comment with HN-style clean formatting */}
        <div 
          className="py-2 px-0"
          style={{ 
            borderLeft: depth > 0 ? '1px solid var(--border-light)' : 'none',
            paddingLeft: depth > 0 ? '12px' : '0'
          }}
        >
          {/* Comment metadata line */}
          <div 
            className="flex items-center gap-2 text-xs mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="font-medium">
              {comment.author.avatar} {comment.author.name}
            </span>
            <span>•</span>
            <span>{comment.createdAt.toLocaleDateString()}</span>
          </div>
          
          {/* Comment content with clean typography */}
          <div 
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
          >
            {comment.content}
          </div>
        </div>
        
        {/* Recursively render all replies with increased depth for indentation */}
        {replies.map(reply => renderComment(reply, depth + 1))}
        
        {/* Add spacing between top-level comment threads */}
        {depth === 0 && replies.length === 0 && (
          <div className="border-b" style={{ borderColor: 'var(--border-light)' }} />
        )}
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
    <div 
      className="mt-2 pt-3"
      style={{ borderTop: '1px solid var(--border-light)' }}
    >
      {/* Clickable header that toggles comments visibility - HN style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium hover:underline transition-colors mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {/* Simple arrow that rotates based on expanded state */}
        <span className={`transform transition-transform text-xs ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
          ▶
        </span>
        {postComments.length === 0 ? 'Add comment' : `${postComments.length} comment${postComments.length !== 1 ? 's' : ''}`}
      </button>
      
      {/* Comments content - only visible when expanded */}
      {isExpanded && (
        <div style={{ backgroundColor: 'var(--comment-bg)' }} className="p-3 rounded-sm">
          {/* Render existing comments if any exist */}
          {topLevelComments.length > 0 && (
            <div className="mb-4">
              {topLevelComments.map(comment => renderComment(comment))}
            </div>
          )}
          
          {/* New comment form with clean styling */}
          <div 
            className="p-3 rounded-sm"
            style={{ 
              backgroundColor: 'var(--post-bg)',
              border: '1px solid var(--border-light)'
            }}
          >
            <form onSubmit={handleCommentSubmit}>
              <textarea
                value={newComment} // Controlled input - value comes from state
                onChange={(e) => setNewComment(e.target.value)} // Update state on every keystroke
                className="w-full p-2 text-sm rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ 
                  border: '1px solid var(--border-medium)'
                }}
                rows={3}
                placeholder="Add a comment..."
              />
              <button 
                type="submit"
                className="mt-2 px-3 py-1 text-sm rounded-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--header-blue)',
                  color: 'var(--header-text)'
                }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}