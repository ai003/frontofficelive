// src/firebase/seedData.ts
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { users, posts, comments } from '../data/sampleData';
import type { User, Post, Comment } from '../types';
import type { FirestoreUser, FirestorePost, FirestoreComment } from '../types/firestore';

// Convert local User to FirestoreUser
function convertUserToFirestore(user: User): FirestoreUser {
  const firestoreUser: FirestoreUser = {
    id: user.id,
    name: user.name,
    role: user.role,
    createdAt: Timestamp.now() // Add current timestamp for creation
  };
  
  // Only include avatar if it exists
  if (user.avatar) {
    firestoreUser.avatar = user.avatar;
  }
  
  return firestoreUser;
}

// Convert local Post to FirestorePost
function convertPostToFirestore(post: Post): FirestorePost {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    authorId: post.author.id,
    authorName: post.author.name,
    authorRole: post.author.role,
    createdAt: Timestamp.fromDate(post.createdAt),
    tags: post.tags,
    commentCount: comments.filter(comment => comment.postId === post.id).length
  };
}

// Calculate threading information for comments
function calculateThreading(comment: Comment, allComments: Comment[]): {
  depth: number;
  path: string;
  threadRoot: string;
} {
  if (!comment.parentId) {
    // Root level comment
    return {
      depth: 0,
      path: comment.id,
      threadRoot: comment.id
    };
  }

  // Find parent comment
  const parent = allComments.find(c => c.id === comment.parentId);
  if (!parent) {
    // Fallback if parent not found
    return {
      depth: 0,
      path: comment.id,
      threadRoot: comment.id
    };
  }

  // Recursively calculate parent's threading
  const parentThreading = calculateThreading(parent, allComments);
  
  return {
    depth: parentThreading.depth + 1,
    path: `${parentThreading.path}/${comment.id}`,
    threadRoot: parentThreading.threadRoot
  };
}

// Convert local Comment to FirestoreComment
function convertCommentToFirestore(comment: Comment, allComments: Comment[]): FirestoreComment {
  const threading = calculateThreading(comment, allComments);
  
  return {
    id: comment.id,
    postId: comment.postId,
    content: comment.content,
    authorId: comment.author.id,
    authorName: comment.author.name,
    authorRole: comment.author.role,
    createdAt: Timestamp.fromDate(comment.createdAt),
    parentId: comment.parentId,
    depth: threading.depth,
    path: threading.path,
    threadRoot: threading.threadRoot
  };
}

// Main seeding function
export async function seedFirestore(): Promise<void> {
  try {
    console.log('Starting Firestore seeding...');

    // Convert and seed users
    console.log('Seeding users...');
    for (const user of users) {
      const firestoreUser = convertUserToFirestore(user);
      await setDoc(doc(db, 'users', user.id), firestoreUser);
    }

    // Convert and seed posts
    console.log('Seeding posts...');
    for (const post of posts) {
      const firestorePost = convertPostToFirestore(post);
      await setDoc(doc(db, 'posts', post.id), firestorePost);
    }

    // Convert and seed comments
    console.log('Seeding comments...');
    for (const comment of comments) {
      const firestoreComment = convertCommentToFirestore(comment, comments);
      await setDoc(doc(db, 'comments', comment.id), firestoreComment);
    }

    console.log('Firestore seeding completed successfully!');
    console.log(`Seeded: ${users.length} users, ${posts.length} posts, ${comments.length} comments`);
    
  } catch (error) {
    console.error('Error seeding Firestore:', error);
    throw error;
  }
}

// Helper function to clear all collections (for development/testing)
export async function clearFirestore(): Promise<void> {
  console.log('Clearing Firestore collections...');
  // Note: In production, you'd want to use batch operations or admin SDK
  // This is a simplified version for development
  console.log('Clear function not implemented - manually delete collections in Firebase console');
}