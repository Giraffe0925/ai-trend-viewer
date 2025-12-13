
export interface Article {
    id: string;
    title: string;
    source: 'arxiv' | 'rss' | 'x' | 'other';
    url: string;
    summary: string;
    publishedAt: string;
    author?: string;
    originalContent?: string;
    titleJa?: string;
    summaryJa?: string;
    explanationJa?: string;
    translationJa?: string;
    insightJa?: string;
    recommendedBooks?: string[]; // Array of book search keywords for Amazon
    category?: 'AI' | 'Science' | 'Philosophy';
    tags?: string[];
}
