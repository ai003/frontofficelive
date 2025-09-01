import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, onSnapshot, Timestamp, doc, setDoc, getDoc, where } from 'firebase/firestore';
import type { FirestorePost, FirestoreComment, FirestoreUser } from '../types/firestore';

// Display name utilities for consistent name display throughout the app
export function getDisplayName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function getFullDisplayName(user: { firstName: string; lastName: string; username: string }): string {
  const displayName = getDisplayName(user);
  return `${displayName} (@${user.username})`;
}

// Username validation utilities
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be no more than 20 characters long' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { isValid: true };
}

// Check if username already exists in Firebase
export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    const snapshot = await getDocs(usersQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw new Error('Failed to check username availability');
  }
}

// Create new user with firstName, lastName, username
export async function createUser(
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  username: string
): Promise<void> {
  // Validate username format
  const validation = validateUsername(username);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  // Check username uniqueness
  const usernameExists = await checkUsernameExists(username);
  if (usernameExists) {
    throw new Error('Username is already taken');
  }
  
  // Create user document
  const userData: Omit<FirestoreUser, 'id'> = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    username: username.toLowerCase().trim(),
    email: email,
    role: 'user',
    createdAt: Timestamp.now()
  };
  
  await setDoc(doc(db, 'users', uid), userData);
}

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


// Add new comment to Firestore with Reddit-style threading support
export async function addComment(
  postId: string,
  content: string,
  authorId: string,
  authorName: string,
  authorRole: 'admin' | 'user',
  parentId: string | null = null
): Promise<ServiceComment> {
  try {
    // First create document reference to get the ID
    const docRef = doc(collection(db, 'comments'));
    
    let depth = 0;
    let threadRoot = docRef.id; // Default to self for top-level comments
    
    // If this is a reply, fetch parent comment to calculate depth and thread root
    if (parentId) {
      try {
        const parentDoc = await getDoc(doc(db, 'comments', parentId));
        if (parentDoc.exists()) {
          const parentData = parentDoc.data();
          depth = (parentData.depth || 0) + 1; // Parent depth + 1
          threadRoot = parentData.threadRoot || parentId; // Use parent's thread root
        } else {
          // Parent doesn't exist, treat as top-level comment
          console.warn('Parent comment not found, creating as top-level comment');
          parentId = null;
        }
      } catch (error) {
        console.error('Error fetching parent comment:', error);
        // Fall back to top-level comment
        parentId = null;
      }
    }
    
    const newComment = {
      id: docRef.id,
      postId,
      content,
      authorId,
      authorName,
      authorRole,
      createdAt: Timestamp.now(),
      parentId, // null for top-level, string for replies
      depth, // 0 for top-level, 1+ for replies
      threadRoot // ID of the top-level comment in this thread
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