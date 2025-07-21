"use client"

/**
 * Props interface for the TodoImage component
 */
interface TodoImageProps {
  imageUrl: string; // URL of the image to display, empty string indicates loading state
  title: string; // Alt text for the image, typically the todo title
}

/**
 * TodoImage component displays either a loading spinner or an image
 * Shows a loading spinner when imageUrl is empty (image still being fetched from Pexels API)
 * Shows the actual image once the URL is available
 */
const TodoImage = ({ imageUrl, title }: TodoImageProps) => {
  // Show loading spinner while image is being fetched
  if (imageUrl === '') {
    return (
      <div className="w-16 h-16 rounded-md mr-4 flex-shrink-0 bg-gray-200 flex items-center justify-center">
        {/* Animated loading spinner */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }
  
  // Display the actual image once loaded
  return (
    <img 
      src={imageUrl} 
      alt={title} 
      className="w-16 h-16 object-cover rounded-md mr-4 flex-shrink-0"
    />
  );
};

export default TodoImage; 