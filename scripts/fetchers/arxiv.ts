
import { Article, FetcherResult } from '../types';

const ARXIV_API_URL = 'http://export.arxiv.org/api/query';

// Category mapping for detailed classification
function getCategoryName(arxivCategory: string): string {
    // AI categories
    if (arxivCategory.startsWith('cs.AI') ||
        arxivCategory.startsWith('cs.LG') ||
        arxivCategory.startsWith('cs.CL') ||
        arxivCategory.startsWith('stat.ML')) {
        return 'AI';
    }
    // Cognition / Neuroscience
    if (arxivCategory.startsWith('q-bio.NC') ||
        arxivCategory.startsWith('cs.HC') ||
        arxivCategory.startsWith('q-bio.QM')) {
        return '認知科学';
    }
    // Philosophy
    if (arxivCategory.startsWith('physics.hist-ph')) {
        return '哲学';
    }
    // Economics
    if (arxivCategory.startsWith('econ')) {
        return '経済学';
    }
    // Society / AI Ethics
    if (arxivCategory.startsWith('cs.CY')) {
        return '社会';
    }
    // Default
    return 'Science';
}

export async function fetchArxivPapers(
    category: string,
    maxResults: number = 5
): Promise<FetcherResult> {
    try {
        const query = `search_query=cat:${category}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
        const response = await fetch(`${ARXIV_API_URL}?${query}`);
        const text = await response.text();

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
                    category: getCategoryName(category),
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
