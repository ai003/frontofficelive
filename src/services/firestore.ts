import { db } from '../firebase/config';
import { collection, getDocs, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { FirestorePost, FirestoreComment } from '../types/firestore';

// Service layer interfaces with Date objects (converted from Firestore Timestamps)
interface ServicePost extends Omit<FirestorePost, 'createdAt'> {
  createdAt: Date;
}

interface ServiceComment extends Omit<FirestoreComment, 'createdAt'> {
  createdAt: Date;
}

// Load posts from Firestore
export async function loadPosts(): Promise<ServicePost[]> {
  try {
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(postsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as FirestorePost;
      return {
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      };
    });
  } catch (error) {
    console.error('Error loading posts:', error);
    throw error;
  }
}

// Load comments from Firestore
export async function loadComments(): Promise<ServiceComment[]> {
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(commentsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as FirestoreComment;
      return {
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      };
    });
  } catch (error) {
    console.error('Error loading comments:', error);
    throw error;
  }
}

// Add new post to Firestore
export async function addPost(
  title: string,
  content: string,
  authorId: string,
  authorName: string,
  authorRole: 'admin' | 'user',
  tags: string[] = []
): Promise<ServicePost> {
  try {
    const newPost = {
      title,
      content,
      authorId,
      authorName,
      authorRole,
      createdAt: Timestamp.now(),
      tags,
      commentCount: 0
    };

    const docRef = await addDoc(collection(db, 'posts'), newPost);
    
    return {
      id: docRef.id,
      ...newPost,
      createdAt: newPost.createdAt.toDate()
    };
  } catch (error) {
    console.error('Error adding post:', error);
    throw error;
  }
}


// Add new comment to Firestore
export async function addComment(
  postId: string,
  content: string,
  authorId: string,
  authorName: string,
  authorRole: 'admin' | 'user',
  parentId: string | null = null
): Promise<ServiceComment> {
  try {
    // Performance optimization opportunity: Currently loads all comments to calculate threading.
    // For posts with 500+ comments, this could be optimized to query only the parent comment.
    const existingComments = await loadComments();
    
    // Calculate threading based on parent comment
    let depth = 0;
    let threadRoot = '';
    let parentPath = '';
    
    if (parentId) {
      const parent = existingComments.find(c => c.id === parentId);
      if (parent) {
        depth = parent.depth + 1;
        threadRoot = parent.threadRoot;
        parentPath = parent.path;
      }
    }

    // Create comment with placeholder path - will be updated after document creation
    const newComment = {
      postId,
      content,
      authorId,
      authorName,
      authorRole,
      createdAt: Timestamp.now(),
      parentId,
      depth,
      path: '', // Will be set after document creation
      threadRoot: '' // Will be set after document creation
    };

    const docRef = await addDoc(collection(db, 'comments'), newComment);
    
    // Set final path and threadRoot using actual document ID (matches seed data logic)
    const finalPath = parentId ? `${parentPath}/${docRef.id}` : docRef.id;
    const finalThreadRoot = parentId ? threadRoot : docRef.id;

    return {
      id: docRef.id,
      ...newComment,
      path: finalPath,
      threadRoot: finalThreadRoot,
      createdAt: newComment.createdAt.toDate()
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

// Subscribe to posts updates
export function subscribeToPostsUpdates(
  callback: (posts: ServicePost[]) => void
): () => void {
  const postsQuery = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    postsQuery,
    (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const data = doc.data() as FirestorePost;
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
        };
      });
      callback(posts);
    },
    (error) => {
      console.error('Error in posts subscription:', error);
    }
  );
}

// Subscribe to comments updates
export function subscribeToCommentsUpdates(
  callback: (comments: ServiceComment[]) => void
): () => void {
  const commentsQuery = query(
    collection(db, 'comments'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    commentsQuery,
    (snapshot) => {
      const comments = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreComment;
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
        };
      });
      callback(comments);
    },
    (error) => {
      console.error('Error in comments subscription:', error);
    }
  );
}