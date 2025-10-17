import { useState } from 'react';
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
  // Function to trigger authentication modal when login is required
  onLoginRequired: () => void;
}

export default function PostList({ posts, comments, onAddComment, onLoginRequired }: PostListProps) {
  // Track which posts have their comments expanded
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  // Toggle comments visibility for a specific post
  const toggleComments = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <div>
      {/* Map through each post and render it with its associated components */}
      {posts.map(post => {
        const postComments = comments.filter(c => c.postId === post.id);
        const isExpanded = expandedPosts.has(post.id);

        return (
          <div key={post.id}>
            {/* Render the main post content with comment toggle button */}
            <PostCard
              post={post}
              commentCount={postComments.length}
              isCommentsExpanded={isExpanded}
              onToggleComments={() => toggleComments(post.id)}
            />

            {/* Render the comments section for this specific post */}
            <CommentSection
              postId={post.id}
              comments={comments}
              // Pass the comment handler function down to CommentSection
              // This allows comments to be added and saved to localStorage
              onAddComment={onAddComment}
              // Pass login handler for authentication-aware commenting
              onLoginRequired={onLoginRequired}
              // Pass expanded state from parent
              isExpanded={isExpanded}
            />

            {/* Separator line below each post - always visible */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600" />
          </div>
        );
      })}
    </div>
  );
}