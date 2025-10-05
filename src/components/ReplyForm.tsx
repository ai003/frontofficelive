import { useState, useEffect, useRef } from 'react';
import type { Comment } from '../types';

interface ReplyFormProps {
  parentComment: Comment;
  onSubmit: (parentId: string, content: string) => Promise<void>;
  onCancel: () => void;
}

export default function ReplyForm({ parentComment, onSubmit, onCancel }: ReplyFormProps) {
  // Initialize with @username and a space
  const [replyContent, setReplyContent] = useState(`@${parentComment.author.name} `);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when component mounts and position cursor at the end
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Position cursor at the end after @username
      textareaRef.current.setSelectionRange(replyContent.length, replyContent.length);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      await onSubmit(parentComment.id, replyContent.trim());
      setReplyContent('');
      onCancel(); // Close the reply form after successful submission
    } catch (error) {
      console.error('Error submitting reply:', error);
      // Could add error toast here in the future
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
    // Cancel on Escape
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
      {/* Context header */}
      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        Replying to <span className="font-medium">{parentComment.author.name}</span>
      </div>
      
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          rows={3}
          placeholder={`Reply to ${parentComment.author.name}...`}
          disabled={isSubmitting}
        />
        
        {/* Action buttons */}
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Press Ctrl+Enter to submit, Esc to cancel
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!replyContent.trim() || isSubmitting}
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Replying...' : 'Reply'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}