import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, onSnapshot, Timestamp, doc, setDoc, getDoc, where, deleteDoc, updateDoc, increment } from 'firebase/firestore';
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

/**
 * Get username by user ID for profile navigation
 *
 * Added for user profile system to enable clickable usernames throughout the forum.
 * Uses existing authorId from posts/comments to fetch username for profile links.
 *
 * @param userId - Firebase user document ID (same as authorId in posts/comments)
 * @returns username string or null if not found/error
 *
 * Usage: ClickableUsername component uses this to convert user IDs to profile URLs
 */
export async function getUsernameById(userId: string): Promise<string | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as FirestoreUser;
      return userData.username;
    }
    return null;
  } catch (error) {
    console.error('Error fetching username:', error);
    return null;
  }
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
export interface ServicePost extends Omit<FirestorePost, 'createdAt'> {
  id: string;
  createdAt: Date;
}

export interface ServiceComment extends Omit<FirestoreComment, 'createdAt'> {
  id: string;
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


// Add new comment to Firestore with Instagram-style flat threading
export async function addComment(
  postId: string,
  content: string,
  authorId: string,
  authorName: string,
  authorUsername: string,
  authorRole: 'admin' | 'user',
  parentId: string | null = null
): Promise<ServiceComment> {
  try {
    // Create document reference to get the ID
    const docRef = doc(collection(db, 'comments'));

    const newComment = {
      id: docRef.id,
      postId,
      content,
      authorId,
      authorName,
      authorUsername,
      authorRole,
      createdAt: Timestamp.now(),
      parentId // null for top-level, string for replies
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

/**
 * Recursively finds all descendant comments (replies at any depth)
 *
 * Exported for reuse in UI (counting replies) and services (cascade delete)
 * Single source of truth for descendant calculation logic
 *
 * @param commentId - ID of parent comment
 * @param allComments - Array of all ServiceComment objects for the post
 * @returns Array of all descendant comments (flattened)
 */
export function getAllCommentDescendants(commentId: string, allComments: ServiceComment[]): ServiceComment[] {
  const directReplies = allComments.filter(c => c.parentId === commentId);
  const allDescendants: ServiceComment[] = [...directReplies];

  directReplies.forEach(reply => {
    const nestedReplies = getAllCommentDescendants(reply.id, allComments);
    allDescendants.push(...nestedReplies);
  });

  return allDescendants;
}

/**
 * Deletes a comment and all its descendants (cascade delete)
 *
 * Implementation: Option A (Cascade Delete)
 * - Deletes parent comment + all child replies recursively
 * - Updates post's commentCount to reflect total deletions
 * - Real-time listeners will update UI automatically
 *
 * Future: Can be extended to support soft delete (Option B/C) via optional flag
 *
 * @param commentId - ID of comment to delete
 * @param postId - ID of parent post (to update commentCount)
 * @returns Promise<number> - Total number of comments deleted (parent + descendants)
 */
export async function deleteComment(
  commentId: string,
  postId: string
): Promise<number> {
  try {
    // Step 1: Fetch all comments for this post to find descendants
    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', postId)
    );
    const snapshot = await getDocs(commentsQuery);
    const allComments: ServiceComment[] = snapshot.docs.map(doc => {
      const data = doc.data() as FirestoreComment;
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      };
    });

    // Step 2: Get all descendants using recursive helper
    const descendants = getAllCommentDescendants(commentId, allComments);

    // Step 3: Delete all descendants first (children before parent)
    await Promise.all(
      descendants.map(d => deleteDoc(doc(db, 'comments', d.id)))
    );

    // Step 4: Delete the parent comment
    await deleteDoc(doc(db, 'comments', commentId));

    // Step 5: Update post's commentCount (decrement by total deleted)
    const totalDeleted = descendants.length + 1;
    await updateDoc(doc(db, 'posts', postId), {
      commentCount: increment(-totalDeleted)
    });

    return totalDeleted;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}