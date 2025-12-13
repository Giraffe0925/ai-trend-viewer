
import { Article, FetcherResult } from '../types';

const ARXIV_API_URL = 'http://export.arxiv.org/api/query';

export async function fetchArxivPapers(
    category: string,
    maxResults: number = 5
): Promise<FetcherResult> {
    try {
        const query = `search_query=cat:${category}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
        const response = await fetch(`${ARXIV_API_URL}?${query}`);
        const text = await response.text();

        // Simple manual parsing to avoid heavy XML deps if rss-parser is not used for this
        // But we installed rss-parser. However, for specialized extraction, regex is sometimes faster for simple Atom.
        // Let's use simple regex for robustness on standard arXiv format.
        // Or better, use a lightweight parser if available. 
        // Since we are in a "scripts" environment, let's just use string parsing for now to reduce complexity 
        // or assume rss-parser is better if generic.
        // Actually, let's use rss-parser in the main aggregator or just regex here for control.

        const entries = text.split('<entry>');
        const articles: Article[] = [];

        // Skip the first split (header)
        for (let i = 1; i < entries.length; i++) {
            const entry = entries[i];
            const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
            const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
            const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
            const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
            const authorMatch = entry.match(/<author>\s*<name>([\s\S]*?)<\/name>/);

            if (titleMatch && idMatch) {
                // Convert arXiv URL from /abs/ to /pdf/ for direct PDF access
                const absUrl = idMatch[1].trim();
                const pdfUrl = absUrl.replace('/abs/', '/pdf/');

                articles.push({
                    id: absUrl,
                    title: titleMatch[1].trim().replace(/\n/g, ' '),
                    source: 'arxiv' as const,
                    url: pdfUrl, // Link to PDF version
                    summary: summaryMatch ? summaryMatch[1].trim() : '',
                    publishedAt: publishedMatch ? publishedMatch[1].trim() : new Date().toISOString(),
                    author: authorMatch ? authorMatch[1].trim() : undefined,
                    category: category.includes('cs.AI') ? 'AI' : 'Science',
                    originalContent: summaryMatch ? summaryMatch[1].trim() : ''
                });
            }
        }

        return { success: true, articles };
    } catch (error) {
        console.error('Error fetching arXiv:', error);
        return { success: false, articles: [], error: String(error) };
    }
}
