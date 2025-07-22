import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, onSnapshot, Timestamp, doc, setDoc } from 'firebase/firestore';
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
        id: doc.id,  // Add the document ID
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
        id: doc.id,  // Add the document ID
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
    // First create document to get the ID
    const docRef = doc(collection(db, 'posts'));
    
    const newPost = {
      id: docRef.id, // Include the ID in the document data
      title,
      content,
      authorId,
      authorName,
      authorRole,
      createdAt: Timestamp.now(),
      tags,
      commentCount: 0
    };

    // Set the document with the ID included
    await setDoc(docRef, newPost);
    
    return {
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
    // Simplified version: Since there's no reply UI yet, all comments are top-level
    // Threading complexity will be added back when reply functionality is implemented
    
    // First create document reference to get the ID
    const docRef = doc(collection(db, 'comments'));
    
    const newComment = {
      id: docRef.id, // Include the ID in the document data
      postId,
      content,
      authorId,
      authorName,
      authorRole,
      createdAt: Timestamp.now(),
      parentId, // Currently always null - no reply UI
      depth: 0, // All comments are top-level for now
      path: docRef.id, // Simple path for top-level comments
      threadRoot: docRef.id // Each comment is its own thread root
    };

    // Set the document with the ID included
    await setDoc(docRef, newComment);
    
    return {
      ...newComment,
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
          id: doc.id,  // Document ID already included
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
          id: doc.id,  // Document ID already included
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