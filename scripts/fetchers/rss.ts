
import Parser from 'rss-parser';
import { Article, FetcherResult } from '../types';

const parser = new Parser();

type CategoryType = 'AI' | 'Science' | 'Philosophy' | '認知科学' | '哲学' | '経済学' | '社会';

export async function fetchRSS(
    url: string,
    category: CategoryType
): Promise<FetcherResult> {
    try {
        const feed = await parser.parseURL(url);
        const articles: Article[] = feed.items.map(item => ({
            id: (item.guid || item.link || '') as string,
            title: (item.title || 'No Title') as string,
            source: 'rss' as const,
            url: (item.link || '') as string,
            summary: (item.contentSnippet || item.content || '') as string,
            publishedAt: (item.pubDate || new Date().toISOString()) as string,
            author: (item.creator || '') as string,
            category: category,
            originalContent: (item.content || item.contentSnippet || '') as string
        })).slice(0, 5); // Limit to 5

        return { success: true, articles };
    } catch (error) {
        console.error(`Error fetching RSS from ${url}:`, error);
        return { success: false, articles: [], error: String(error) };
    }
}
