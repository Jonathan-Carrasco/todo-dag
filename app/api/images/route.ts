import { NextResponse } from 'next/server';
import { createClient } from 'pexels';

// Configuration constants for Pexels API
const IMAGE_SIZE = 'small'; // Size of images to fetch from Pexels
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

/**
 * GET /api/images
 * Fetches a relevant image from Pexels API based on a search query
 * Falls back to a placeholder image if Pexels API fails or returns no results
 * 
 * @param request - Request with query parameter 'query' for image search
 * @returns JSON with imageUrl field containing either Pexels image or placeholder
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  // Validate required query parameter
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Create fallback placeholder image URL
  const fallbackImageUrl = `https://placehold.co/200x200?text=${encodeURIComponent(query)}`;

  try {
    // Check if Pexels API key is configured
    if (!PEXELS_API_KEY) {
      console.error('Pexels API key not configured');
      return NextResponse.json({ error: 'Pexels API key not configured' }, { status: 500 });
    }

    // Create Pexels client and search for images
    const client = createClient(PEXELS_API_KEY);

    return client.photos.search({ query, per_page: 1, size: IMAGE_SIZE })
      .then(response => {
        // Check if we got valid results with photos
        if ('photos' in response && response.photos.length > 0) {
          const photo = response.photos[0];
          return NextResponse.json({ imageUrl: photo.src.small });
        } else {
          // No photos found, use fallback
          console.error('Error fetching image: ', response);
          return NextResponse.json({ imageUrl: fallbackImageUrl });
        }
      })
      .catch(error => {
        // Pexels API error, use fallback
        console.log('Error fetching image: ', error);
        return NextResponse.json({ imageUrl: fallbackImageUrl });
      });

  } catch (error) {
    console.error('Error fetching image from Pexels:', error);
    
    // Log additional error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Return fallback image on any error
    return NextResponse.json({ imageUrl: fallbackImageUrl });
  }
}