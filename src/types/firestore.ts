// src/types/firestore.ts
import { Timestamp } from 'firebase/firestore';

export interface FirestoreUser {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
}

export interface FirestorePost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'user';
  createdAt: Timestamp;
  tags: string[];
  commentCount: number;
}

export interface FirestoreComment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'user';
  createdAt: Timestamp;
  parentId: string | null;  // null = top-level, string = reply to comment
  depth: number;            // 0 = top-level, 1+ = reply depth
  threadRoot: string;       // ID of the top-level comment in this thread
}