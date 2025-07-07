import { useState, useEffect } from 'react';
import Header from './components/Header';
import PostList from './components/PostList';
import CreatePost from './components/CreatePost';
import type { Post, Comment } from './types';
import { loadPosts, savePosts, loadComments, saveComments } from './utils/localStorage';
import { users } from './data/sampleData';

function App() {
  // State management for posts and comments arrays
  // These are loaded from localStorage and updated when users add content
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  // Load data from localStorage on component mount
  // This combines any saved user data with the original dummy data
  useEffect(() => {
    setPosts(loadPosts());
    setComments(loadComments());
  }, []);

  // Handler function to add new posts
  // Creates a new post object and updates both state and localStorage
  const addPost = (title: string, content: string, tags: string[]) => {
    const newPost: Post = {
      id: Date.now().toString(), // Simple unique ID using timestamp
      title,
      content,
      author: users[0], // Default to first user (CoachMike - admin)
      createdAt: new Date(),
      tags
    };

    // Add new post to front of array (newest first)
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts); // Update React state for immediate UI update
    savePosts(updatedPosts); // Persist to localStorage
  };

  // Handler function to add new comments
  // Creates a new comment object and updates both state and localStorage
  const addComment = (postId: string, content: string, parentId: string | null = null) => {
    const newComment: Comment = {
      id: Date.now().toString(), // Simple unique ID using timestamp
      postId,
      content,
      author: users[1], // Default to second user (StatsGuru23)
      createdAt: new Date(),
      parentId // null for top-level comments, comment ID for replies
    };

    // Add new comment to front of array (newest first)
    const updatedComments = [newComment, ...comments];
    setComments(updatedComments); // Update React state for immediate UI update
    saveComments(updatedComments); // Persist to localStorage
  };

  return (
    <>
      {/* Blue header bar with logo and title */}
      <Header />
      
      {/* Main container with Hacker News-inspired styling */}
      <div className="main-container">
        <div className="content-area">
          {/* Create new post form */}
          <CreatePost onAddPost={addPost} />
          
          {/* List of existing posts with their comments */}
          <PostList posts={posts} comments={comments} onAddComment={addComment} />
        </div>
      </div>
    </>
  )
}

export default App