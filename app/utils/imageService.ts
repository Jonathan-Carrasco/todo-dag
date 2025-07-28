/**
 * Image service utility for fetching todo-related images from Pexels API
 * Provides fallback handling and database synchronization for todo images
 */

/**
 * Fetches a relevant image for a todo from the Pexels API and updates the todo
 * @param todoId - ID of the todo to update with the image
 * @param title - Title/description of the todo to use as search query
 * @param onImageUpdate - Callback function to update UI when image is fetched
 */
export const fetchImageForTodo = async (
  todoId: number,
  title: string,
  onImageUpdate: (todoId: number, imageUrl: string) => void
) => {
  try {
    // Fetch image from Pexels API using todo title as search query
    const response = await fetch(`/api/images?query=${encodeURIComponent(title)}`);
    const imageData = await response.json();
    
    // Use fetched image URL or fallback to placeholder if no image found
    const imageUrl: string = imageData.imageUrl || `https://placehold.co/200x200?text=${encodeURIComponent(title)}`;

    // Update UI immediately with the new image
    onImageUpdate(todoId, imageUrl);

    // Persist the image URL to the database
    try {
      await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
    } catch (error) {
      console.error('Error updating todo image in database:', error);
    }

  } catch (error) {
    console.error('Error updating todo image in database:', error);
    
    // On any error, set fallback placeholder image
    const fallbackUrl = `https://placehold.co/200x200?text=${encodeURIComponent(title)}`;
    onImageUpdate(todoId, fallbackUrl);

    // Attempt to save the fallback image URL to database
    try {
      await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: fallbackUrl }),
      });
    } catch (dbError) {
      console.error('Error updating todo in database with fallback:', dbError);
    }
  }
}; 