import type { Post } from '../types';
import ProfilePicture from './ProfilePicture';

// Define props interface for PostCard component
// This component displays the main content of a forum post in Hacker News style
interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    // Clean white card with subtle border and shadow, similar to HN post styling
    <div className="mb-3 p-4 rounded-sm bg-white border border-gray-200 shadow-sm">
      {/* Post title with clean typography */}
      <h2 className="text-lg font-medium leading-tight mb-2 hover:underline cursor-pointer text-gray-900">
        {post.title}
      </h2>
      
      {/* Post metadata - author and date */}
      <div className="flex items-center gap-2 text-sm mb-3 text-gray-600">
        <ProfilePicture user={post.author} size="w-6 h-6" />
        <span className="font-medium">
          {post.author.name}
        </span>
        <span>•</span>
        <span>{post.createdAt.toLocaleDateString()}</span>
      </div>
      
      {/* Post content with clean formatting */}
      <div className="mb-3 leading-relaxed text-sm text-gray-900">
        {post.content}
      </div>
      
      {/* Tags section with subtle styling */}
      {post.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {post.tags.map((tag, index) => (
            <span 
              key={index} 
              className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}