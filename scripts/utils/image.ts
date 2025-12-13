
import { Article } from '../types';

/**
 * Generate an Unsplash image URL based on article tags/keywords.
 * Uses Unsplash Source which doesn't require API authentication.
 */
export function getArticleImageUrl(article: Article): string {
    // Use tags if available, otherwise use category
    const keywords = article.tags?.slice(0, 2) || [article.category || 'technology'];
    const keywordString = keywords.join(',');

    // Use Unsplash Source for free, random relevant images
    // Adding article ID hash to ensure consistent image per article
    const idHash = article.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000;

    return `https://source.unsplash.com/400x300/?${encodeURIComponent(keywordString)}&sig=${idHash}`;
}
