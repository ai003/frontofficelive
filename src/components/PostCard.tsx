import type { Post } from '../types';
import ProfilePicture from './ProfilePicture';
import ClickableUsername from './ClickableUsername'; // Added for user profile navigation

// Define props interface for PostCard component
// This component displays the main content of a forum post in Hacker News style
interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  // DARK THEME CLASSES in PostCard:
  // bg-white -> dark:bg-gray-800 (post cards use gray-800 in dark mode)
  // border-gray-200 -> dark:border-gray-600 (darker borders)
  // text colors are handled individually below
  return (
    // Clean white card with subtle border and shadow, similar to HN post styling
    <div className="mb-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm">
      {/* Post title with clean typography */}
      {/* DARK THEME: Post title text color */}
      {/* text-gray-900 (dark text on light) -> dark:text-gray-100 (light text on dark) */}
      <h2 className="text-lg font-medium leading-tight mb-2 hover:underline cursor-pointer text-gray-900 dark:text-gray-100">
        {post.title}
      </h2>
      
      {/* Post metadata - author and date */}
      {/* DARK THEME: Post metadata (author, date) text color */}
      {/* text-gray-600 (medium gray) -> dark:text-gray-400 (lighter gray in dark mode) */}
      <div className="flex items-center gap-2 text-sm mb-3 text-gray-600 dark:text-gray-400">
        <ProfilePicture user={post.author} size="w-6 h-6" />
        {/* Replaced static author name with ClickableUsername for profile navigation */}
        <ClickableUsername
          userId={post.author.id}
          displayName={post.author.name}
          className="font-medium"
        />
        <span>•</span>
        <span>{post.createdAt.toLocaleDateString()}</span>
      </div>
      
      {/* Post content with clean formatting */}
      {/* DARK THEME: Post content text color */}
      {/* text-gray-900 (dark text) -> dark:text-gray-100 (light text in dark mode) */}
      <div className="mb-3 leading-relaxed text-sm text-gray-900 dark:text-gray-100">
        {post.content}
      </div>
      
      {/* Tags section with subtle styling */}
      {post.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {post.tags.map((tag, index) => (
            <span 
              key={index} 
              // DARK THEME: Tag styling
              // bg-gray-200 -> dark:bg-gray-700 (tag background)
              // text-gray-600 -> dark:text-gray-300 (tag text)
              className="px-2 py-1 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}