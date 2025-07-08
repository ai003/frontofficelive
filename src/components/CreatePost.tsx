import { useState } from 'react';

// Define the props interface for the CreatePost component
// This component receives a function from the parent (App.tsx) to handle adding new posts
interface CreatePostProps {
  onAddPost: (title: string, content: string, tags: string[]) => void;
}

export default function CreatePost({ onAddPost }: CreatePostProps) {
  // State management for form fields
  // These track the current values of each input field
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    // Prevent the default form submission behavior (which would reload the page)
    e.preventDefault();
    
    // Only proceed if title and content have non-empty values after trimming whitespace
    if (title.trim() && content.trim()) {
      // Convert the comma-separated tags string into an array
      // Split by comma, trim whitespace from each tag, and filter out empty strings
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      // Call the parent function to add the new post
      // This will update the state in App.tsx and save to localStorage
      onAddPost(title.trim(), content.trim(), tagArray);
      
      // Clear all form fields after successful submission
      // This provides immediate feedback that the post was created
      setTitle('');
      setContent('');
      setTags('');
    }
  };

  return (
    // Clean white card matching PostCard styling
    // DARK THEME: bg-white (light) -> dark:bg-gray-800 (dark background)
    // DARK THEME: border-gray-200 (light border) -> dark:border-gray-600 (medium gray border)
    <div className="mb-4 p-4 rounded-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm">
      {/* DARK THEME: text-gray-900 (dark text) -> dark:text-gray-100 (light text) */}
      <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
        Submit a new post
      </h2>
      
      {/* Form with clean HN-style inputs */}
      <form className="space-y-3" onSubmit={handleSubmit}>
        {/* Title input field */}
        <div>
          <label 
            htmlFor="title" 
            className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400" // DARK THEME: text-gray-600 -> dark:text-gray-400
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title} // Controlled input - value comes from state
            onChange={(e) => setTitle(e.target.value)} // Update state on every keystroke
            className="w-full p-2 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" // DARK THEME: border-gray-300->dark:border-gray-600, bg-white->dark:bg-gray-800, text-gray-900->dark:text-gray-100
            placeholder="What's your post about?"
            required // HTML5 validation - form won't submit if empty
          />
        </div>
        
        {/* Content textarea field */}
        <div>
          <label 
            htmlFor="content" 
            className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400" // DARK THEME: text-gray-600 -> dark:text-gray-400
          >
            Text
          </label>
          <textarea
            id="content"
            value={content} // Controlled input - value comes from state
            onChange={(e) => setContent(e.target.value)} // Update state on every keystroke
            rows={4}
            className="w-full p-2 text-sm rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-100 border border-gray-300" // DARK THEME: Missing dark mode classes - needs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
            placeholder="Share your basketball thoughts..."
            required // HTML5 validation - form won't submit if empty
          />
        </div>
        
        {/* Tags input field */}
        <div>
          <label 
            htmlFor="tags" 
            className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400" // DARK THEME: text-gray-600 -> dark:text-gray-400
          >
            Tags (optional)
          </label>
          <input
            type="text"
            id="tags"
            value={tags} // Controlled input - value comes from state
            onChange={(e) => setTags(e.target.value)} // Update state on every keystroke
            className="w-full p-2 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" // DARK THEME: border-gray-300->dark:border-gray-600, bg-white->dark:bg-gray-800, text-gray-900->dark:text-gray-100
            placeholder="NBA, Trade, Lakers (comma separated)"
          />
        </div>
        
        {/* Submit button with HN-style minimal design */}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-sm transition-colors bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white" // DARK THEME: bg-blue-500->dark:bg-blue-600, hover:bg-blue-600->dark:hover:bg-blue-700
        >
          Submit
        </button>
      </form>
    </div>
  );
}