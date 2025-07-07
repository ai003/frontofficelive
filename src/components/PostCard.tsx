import type { Post } from '../types';

// Define props interface for PostCard component
// This component displays the main content of a forum post in Hacker News style
interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    // Clean white card with subtle border and shadow, similar to HN post styling
    <div 
      className="mb-3 p-4 rounded-sm"
      style={{ 
        backgroundColor: 'var(--post-bg)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Post title with clean typography */}
      <h2 
        className="text-lg font-medium leading-tight mb-2 hover:underline cursor-pointer"
        style={{ color: 'var(--text-primary)' }}
      >
        {post.title}
      </h2>
      
      {/* Post metadata - author and date */}
      <div 
        className="flex items-center gap-2 text-sm mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="font-medium">
          {post.author.avatar} {post.author.name}
        </span>
        <span>•</span>
        <span>{post.createdAt.toLocaleDateString()}</span>
      </div>
      
      {/* Post content with clean formatting */}
      <div 
        className="mb-3 leading-relaxed text-sm"
        style={{ color: 'var(--text-primary)' }}
      >
        {post.content}
      </div>
      
      {/* Tags section with subtle styling */}
      {post.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {post.tags.map((tag, index) => (
            <span 
              key={index} 
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ 
                backgroundColor: 'var(--border-light)',
                color: 'var(--text-secondary)'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}