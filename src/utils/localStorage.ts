import type { Post, Comment } from '../types';
import { posts as dummyPosts, comments as dummyComments } from '../data/sampleData';

const POSTS_KEY = 'basketball-forum-posts';
const COMMENTS_KEY = 'basketball-forum-comments';

export function loadPosts(): Post[] {
  try {
    const savedPosts = localStorage.getItem(POSTS_KEY);
    if (savedPosts) {
      const parsedPosts = JSON.parse(savedPosts);
      // Convert date strings back to Date objects
      const postsWithDates = parsedPosts.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt)
      }));
      
      // Merge with dummy data, avoiding duplicates
      const allPosts = [...postsWithDates];
      dummyPosts.forEach(dummyPost => {
        if (!allPosts.find(p => p.id === dummyPost.id)) {
          allPosts.push(dummyPost);
        }
      });
      
      // Sort by creation date, newest first
      return allPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return dummyPosts;
  } catch (error) {
    console.error('Error loading posts from localStorage:', error);
    return dummyPosts;
  }
}

export function savePosts(posts: Post[]): void {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  } catch (error) {
    console.error('Error saving posts to localStorage:', error);
  }
}

export function loadComments(): Comment[] {
  try {
    const savedComments = localStorage.getItem(COMMENTS_KEY);
    if (savedComments) {
      const parsedComments = JSON.parse(savedComments);
      // Convert date strings back to Date objects
      const commentsWithDates = parsedComments.map((comment: any) => ({
        ...comment,
        createdAt: new Date(comment.createdAt)
      }));
      
      // Merge with dummy data, avoiding duplicates
      const allComments = [...commentsWithDates];
      dummyComments.forEach(dummyComment => {
        if (!allComments.find(c => c.id === dummyComment.id)) {
          allComments.push(dummyComment);
        }
      });
      
      // Sort by creation date, newest first
      return allComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return dummyComments;
  } catch (error) {
    console.error('Error loading comments from localStorage:', error);
    return dummyComments;
  }
}

export function saveComments(comments: Comment[]): void {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  } catch (error) {
    console.error('Error saving comments to localStorage:', error);
  }
}