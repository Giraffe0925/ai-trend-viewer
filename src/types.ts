
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
    recommendedBooks?: string[];
    imageUrl?: string;
    category?: 'AI' | 'Science' | 'Philosophy' | '認知科学' | '哲学' | '経済学' | '社会';
    tags?: string[];
    visualSuggestions?: string[];
    visualImages?: string[];
    audioUrl?: string;
}
