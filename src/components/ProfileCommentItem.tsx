import { useNavigate } from 'react-router-dom';
import type { ServiceComment } from '../services/firestore';

interface ProfileCommentItemProps {
  comment: ServiceComment;
}

/**
 * Format relative time for comment display
 * Shows "X minutes/hours/days ago" format
 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * ProfileCommentItem - Display user's comment in profile activity tab
 *
 * Features:
 * - Clickable card that navigates to the post
 * - Header shows "{username} commented on a post"
 * - Relative timestamp (e.g., "2 hours ago")
 * - Comment text with 200 character truncation
 * - Hover effect for clickability
 * - Light divider between header and content
 */
export default function ProfileCommentItem({ comment }: ProfileCommentItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/post/${comment.postId}`);
  };

  // Truncate comment text if longer than 200 characters
  const truncatedContent = comment.content.length > 200
    ? comment.content.substring(0, 200) + '...'
    : comment.content;

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer"
    >
      {/* Header Section */}
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {comment.authorUsername} commented on a post
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatRelativeTime(comment.createdAt)}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

      {/* Comment Content */}
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {truncatedContent}
      </p>
    </div>
  );
}
