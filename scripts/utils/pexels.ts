
import { Article } from '../types';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

interface PexelsPhoto {
    src: {
        medium: string;
        small: string;
        large: string;
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

/**
 * Fetch images for visual suggestions to create actual diagrams/illustrations
 */
export async function fetchDiagramImages(visualSuggestions: string[]): Promise<string[]> {
    if (!PEXELS_API_KEY || !visualSuggestions || visualSuggestions.length === 0) {
        return [];
    }

    const images: string[] = [];

    for (const suggestion of visualSuggestions) {
        try {
            // Extract key concepts from the Japanese suggestion for image search
            // Simple approach: use the suggestion directly or extract keywords
            const keywords = extractKeywords(suggestion);

            const response = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&per_page=1&orientation=landscape`,
                {
                    headers: {
                        'Authorization': PEXELS_API_KEY
                    }
                }
            );

            if (response.ok) {
                const data: PexelsResponse = await response.json();
                if (data.photos && data.photos.length > 0) {
                    images.push(data.photos[0].src.large);
                } else {
                    images.push(''); // No image found
                }
            } else {
                images.push('');
            }

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 500));
        } catch (error) {
            console.warn('Failed to fetch diagram image:', error);
            images.push('');
        }
    }

    return images;
}

/**
 * Extract searchable keywords from Japanese visual suggestion
 */
function extractKeywords(suggestion: string): string {
    // Map common Japanese terms to English for better Pexels search
    const keywordMap: Record<string, string> = {
        '地図': 'map',
        'グラフ': 'graph chart',
        '図': 'diagram',
        'フローチャート': 'flowchart',
        '構造': 'structure',
        'ネットワーク': 'network',
        'AI': 'artificial intelligence',
        '機械学習': 'machine learning',
        '脳': 'brain neuroscience',
        'データ': 'data analytics',
        '分析': 'analysis',
        '比較': 'comparison',
        '進化': 'evolution',
        '変化': 'change transformation',
        'モデル': 'model',
        'プロセス': 'process',
        '哲学': 'philosophy thinking',
        '経済': 'economy business',
        '社会': 'society people',
        '環境': 'environment nature',
        '技術': 'technology',
    };

    let searchQuery = 'abstract concept';

    for (const [japanese, english] of Object.entries(keywordMap)) {
        if (suggestion.includes(japanese)) {
            searchQuery = english;
            break;
        }
    }

    return searchQuery;
}

