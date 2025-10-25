// src/types/firestore.ts
import { Timestamp } from 'firebase/firestore';

export interface FirestoreUser {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
}

export interface FirestorePost {
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'user';
  createdAt: Timestamp;
  tags: string[];
  commentCount?: number;  // Optional: old posts have it, new posts don't
}

export interface FirestoreComment {
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorRole: 'admin' | 'user';
  createdAt: Timestamp;
  parentId: string | null;  // null = top-level, string = reply to comment
}