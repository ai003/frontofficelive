import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PostList from './components/PostList';
import CreatePost from './components/CreatePost';
import UserSelectionModal from './components/UserSelectionModal';
import AuthPage from './components/AuthPage';
import type { Post, Comment } from './types';
import { loadPosts, loadComments, addPost as addPostToFirebase, addComment as addCommentToFirebase, subscribeToPostsUpdates, subscribeToCommentsUpdates } from './services/firestore';

// Helper functions to convert Firebase service types to component types
const convertServicePostToPost = (servicePost: any): Post => ({
  ...servicePost,
  author: {
    id: servicePost.authorId,
    name: servicePost.authorName,
    role: servicePost.authorRole
  }
});

const convertServiceCommentToComment = (serviceComment: any): Comment => ({
  ...serviceComment,
  author: {
    id: serviceComment.authorId,
    name: serviceComment.authorName,
    role: serviceComment.authorRole
  }
});
// Available users for selection
export const AVAILABLE_USERS = [
  { id: '1', name: 'CoachMike', role: 'admin' as const, description: 'Can post and comment' },
  { id: '2', name: 'StatsGuru23', role: 'user' as const, description: 'Can only comment' },
  { id: '3', name: 'HoopsAnalyst', role: 'user' as const, description: 'Can only comment' }
];

export type User = typeof AVAILABLE_USERS[0];

interface ForumContentProps {
  selectedUser: User;
  onSelectUser: (user: User) => void;
}

const ForumContent: React.FC<ForumContentProps> = ({ selectedUser, onSelectUser }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Load initial data from Firebase and set up real-time listeners
  useEffect(() => {
    let postsUnsubscribe: (() => void) | undefined;
    let commentsUnsubscribe: (() => void) | undefined;

    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load initial data
        const [initialPosts, initialComments] = await Promise.all([
          loadPosts(),
          loadComments()
        ]);

        setPosts(initialPosts.map(convertServicePostToPost));
        setComments(initialComments.map(convertServiceCommentToComment));

        // Set up real-time listeners
        postsUnsubscribe = subscribeToPostsUpdates((updatedPosts) => {
          setPosts(updatedPosts.map(convertServicePostToPost));
        });

        commentsUnsubscribe = subscribeToCommentsUpdates((updatedComments) => {
          setComments(updatedComments.map(convertServiceCommentToComment));
        });

        setLoading(false);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load data from Firebase');
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup listeners on unmount
    return () => {
      if (postsUnsubscribe) postsUnsubscribe();
      if (commentsUnsubscribe) commentsUnsubscribe();
    };
  }, []);

  // Handler function to add new posts
  // Creates a new post in Firebase - real-time listeners will update UI automatically
  const addPost = async (title: string, content: string, tags: string[]) => {
    try {
      await addPostToFirebase(
        title,
        content,
        selectedUser.id,
        selectedUser.name,
        selectedUser.role,
        tags
      );
      
      // No need to update local state - real-time listener will handle it
    } catch (err) {
      console.error('Error adding post:', err);
      setError('Failed to add post');
    }
  };

  // Handler function to add new comments
  // Creates a new comment in Firebase - real-time listeners will update UI automatically
  const addComment = async (postId: string, content: string, parentId: string | null = null) => {
    try {
      await addCommentToFirebase(
        postId,
        content,
        selectedUser.id,
        selectedUser.name,
        selectedUser.role,
        parentId
      );
      
      // No need to update local state - real-time listener will handle it
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  // Show loading state while initializing Firebase connection
  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading posts...</p>
        </div>
      </div>
    );
  }

  // Show error state if Firebase connection fails
  if (error) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }



  // DARK THEME: Full-width background container
  // bg-gray-100 (light) -> dark:bg-gray-900 (darkest background when dark mode active)
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Blue header bar with logo and title */}
      <Header 
        selectedUser={selectedUser}
        showUserDropdown={showUserDropdown}
        setShowUserDropdown={setShowUserDropdown}
        onSelectUser={onSelectUser}
      />
      
      {/* Main container with Hacker News-inspired styling */}
      <div className="max-w-4xl mx-auto px-8">
        <div className="py-4">
          {/* Create new post form - only show for admins */}
          {selectedUser.role === 'admin' ? (
            <CreatePost onAddPost={addPost} />
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200">
                Only admins can create posts
              </p>
            </div>
          )}
          
          {/* List of existing posts with their comments */}
          <PostList posts={posts} comments={comments} onAddComment={addComment} />
        </div>
      </div>
    </div>
  );
};

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Show user selection modal if no user is selected
  if (!selectedUser) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<UserSelectionModal onSelectUser={setSelectedUser} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ForumContent selectedUser={selectedUser} onSelectUser={setSelectedUser} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App