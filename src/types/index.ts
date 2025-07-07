export interface User {
  id: string;
  name: string;
  avatar: string;
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