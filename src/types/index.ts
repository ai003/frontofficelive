export interface User {
  id: string;
  name: string;  // This will be the display name (firstName + lastName)
  username?: string;  // Username for @mentions
  avatar?: string;
  role: 'admin' | 'user';
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  createdAt: Date;
  tags: string[];
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: User;
  createdAt: Date;
  parentId: string | null;
}