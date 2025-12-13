
export interface Article {
  id: string;
  title: string;
  source: 'arxiv' | 'rss' | 'x' | 'other';
  url: string;
  summary: string;
  publishedAt: string;
  author?: string;
  originalContent?: string; // For LLM processing
  // Processed fields
  titleJa?: string;
  summaryJa?: string;
  explanationJa?: string;
  translationJa?: string;
  insightJa?: string;
  recommendedBooks?: string[];
  imageUrl?: string;
  category?: 'AI' | 'Science' | 'Philosophy' | '認知科学' | '哲学' | '経済学' | '社会';
  tags?: string[];
}

export interface FetcherResult {
  success: boolean;
  articles: Article[];
  error?: string;
}
