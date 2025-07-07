import type { Post, Comment } from '../types';
import PostCard from './PostCard';
import CommentSection from './CommentSection';

// Define props interface for PostList component
// This component renders a list of posts and manages the interaction between posts and comments
interface PostListProps {
  posts: Post[];
  comments: Comment[];
  // Function passed down from App.tsx to handle adding new comments
  onAddComment: (postId: string, content: string, parentId?: string | null) => void;
}

export default function PostList({ posts, comments, onAddComment }: PostListProps) {
  return (
    <div className="space-y-2">
      {/* Map through each post and render it with its associated components */}
      {posts.map(post => (
        <div key={post.id}>
          {/* Render the main post content */}
          <PostCard post={post} />
          
          {/* Render the comments section for this specific post */}
          <CommentSection 
            postId={post.id} 
            comments={comments}
            // Pass the comment handler function down to CommentSection
            // This allows comments to be added and saved to localStorage
            onAddComment={onAddComment}
          />
        </div>
      ))}
    </div>
  );
}