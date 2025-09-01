import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import PostList from './components/PostList';
import CreatePost from './components/CreatePost';
import AuthModal from './components/AuthModal';
import type { Post, Comment } from './types';
import { loadPosts, loadComments, addPost as addPostToFirebase, addComment as addCommentToFirebase, subscribeToPostsUpdates, subscribeToCommentsUpdates, getDisplayName } from './services/firestore';

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


const ForumContent: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // AuthModal state for login/signup functionality
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Handler to trigger login modal when authentication is required
  const handleLoginRequired = () => {
    setIsAuthModalOpen(true);
  };

  // Load initial data from Firebase and set up real-time listeners
  useEffect(() => {
    // These variables hold cleanup functions returned by Firebase listeners
    // They're used to stop listening when component unmounts (prevents memory leaks)
    let postsUnsubscribe: (() => void) | undefined;
    let commentsUnsubscribe: (() => void) | undefined;

    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // STEP 1: Load initial data from Firestore (one-time fetch)
        // loadPosts() - from './services/firestore' - queries 'posts' collection, orders by createdAt desc
        // loadComments() - from './services/firestore' - queries 'comments' collection, orders by createdAt asc
        // Promise.all runs both queries in parallel for better performance
        const [initialPosts, initialComments] = await Promise.all([
          loadPosts(),    // Returns ServicePost[] from Firestore
          loadComments()  // Returns ServiceComment[] from Firestore
        ]);

        // STEP 2: Convert data format and update React state
        // convertServicePostToPost - converts ServicePost to Post (restructures author field)
        // convertServiceCommentToComment - converts ServiceComment to Comment (restructures author field)
        setPosts(initialPosts.map(convertServicePostToPost));
        setComments(initialComments.map(convertServiceCommentToComment));

        // STEP 3: Set up real-time listeners for live updates
        // subscribeToPostsUpdates() - from './services/firestore' - uses Firebase onSnapshot
        // Returns cleanup function to stop listening, callback fires when posts change
        postsUnsubscribe = subscribeToPostsUpdates((updatedPosts) => {
          setPosts(updatedPosts.map(convertServicePostToPost));
        });

        // subscribeToCommentsUpdates() - from './services/firestore' - uses Firebase onSnapshot  
        // Returns cleanup function to stop listening, callback fires when comments change
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

    // CLEANUP: Stop Firebase listeners when component unmounts
    // Without this, listeners would continue running after component is destroyed
    // This prevents memory leaks and unnecessary Firebase calls
    return () => {
      if (postsUnsubscribe) postsUnsubscribe();   // Stop posts listener
      if (commentsUnsubscribe) commentsUnsubscribe(); // Stop comments listener
    };
  }, []);

  // Handler function to add new posts
  // Creates a new post in Firebase - real-time listeners will update UI automatically
  const addPost = async (title: string, content: string, tags: string[]) => {
    // Check if user is authenticated before allowing post creation
    // If not authenticated, silently return (UI will show login button instead)
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      await addPostToFirebase(
        title,
        content,
        user.id,     // Real authenticated user ID
        getDisplayName(user),   // Real authenticated user display name  
        user.role as 'admin' | 'user',   // Real authenticated user role (cast for TypeScript)
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
    // Check if user is authenticated before allowing comment creation
    // If not authenticated, silently return (UI will show login button instead)
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      await addCommentToFirebase(
        postId,
        content,
        user.id,     // Real authenticated user ID
        getDisplayName(user),   // Real authenticated user display name
        user.role as 'admin' | 'user',   // Real authenticated user role (cast for TypeScript)
        parentId
      );
      
      // No need to update local state - real-time listener will handle it
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  // Show loading state while initializing Firebase connection or during auth changes
  if (loading || authLoading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Front Office...</p>
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
            Reload
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
      <Header onLoginRequired={handleLoginRequired} />
      
      {/* Main container with Hacker News-inspired styling */}
      <div className="max-w-4xl mx-auto px-8">
        <div className="py-4">
          {/* Conditional rendering based on authentication status */}
          {isAuthenticated ? (
            <CreatePost onAddPost={addPost} />
          ) : (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 mb-3">
                Join the conversation! Sign up or log in to create posts and share your basketball insights.
              </p>
              <button
                onClick={handleLoginRequired}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Login / Sign Up to Create Post
              </button>
            </div>
          )}
          
          {/* List of existing posts with their comments */}
          <PostList 
            posts={posts} 
            comments={comments} 
            onAddComment={addComment}
            onLoginRequired={handleLoginRequired}
          />
        </div>
      </div>
      
      {/* AuthModal for login/signup functionality */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ForumContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App