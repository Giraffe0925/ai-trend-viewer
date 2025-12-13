
import { Article } from '../types';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

interface PexelsPhoto {
    src: {
        medium: string;
        small: string;
    };
}

interface PexelsResponse {
    photos: PexelsPhoto[];
}

/**
 * Fetch a relevant image from Pexels based on article keywords/tags.
 */
export async function fetchPexelsImage(article: Article): Promise<string> {
    if (!PEXELS_API_KEY) {
        console.warn('PEXELS_API_KEY not found, using fallback image');
        return '';
    }

    // Build search query from tags or category
    const searchTerms = article.tags?.slice(0, 2) || [article.category || 'technology'];
    const query = searchTerms.join(' ');

    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
            {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            }
        );

        if (!response.ok) {
            console.warn(`Pexels API error: ${response.status}`);
            return '';
        }

        const data: PexelsResponse = await response.json();

        if (data.photos && data.photos.length > 0) {
            return data.photos[0].src.medium;
        }
    } catch (error) {
        console.warn('Failed to fetch Pexels image:', error);
    }

    return '';
}
