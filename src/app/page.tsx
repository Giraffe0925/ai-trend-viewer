
import { Article } from '@/types';
import ArticleCard from '@/components/ArticleCard';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

const ARTICLES_PER_PAGE = 20;

async function getArticles(): Promise<Article[]> {
  const filePath = path.join(process.cwd(), 'data', 'posts.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load articles:', error);
  }
  return [];
}

interface HomeProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = params.q?.toLowerCase() || '';
  const currentPage = parseInt(params.page || '1', 10);

  const articles = await getArticles();

  // Filter articles based on search query
  let filteredArticles = articles;
  if (query) {
    filteredArticles = articles.filter(article =>
      article.title?.toLowerCase().includes(query) ||
      article.titleJa?.toLowerCase().includes(query) ||
      article.summaryJa?.toLowerCase().includes(query) ||
      article.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      article.category?.toLowerCase().includes(query)
    );
  }

  const sortedArticles = filteredArticles.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Pagination
  const totalArticles = sortedArticles.length;
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = sortedArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  // Build pagination URL
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('page', page.toString());
    return `/?${params.toString()}`;
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-16">
        <h2 className="text-4xl font-bold tracking-tight text-gray-700">
          日々、知を読む。
        </h2>
        <p className="text-gray-500 max-w-lg mx-auto leading-loose">
          科学・哲学・テクノロジー。<br />
          世界の最先端研究を、<br />
          分かりやすく日本語でお届けします。
        </p>
      </section>

      {/* Search Results Info */}
      {query && (
        <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
          「{params.q}」の検索結果: {totalArticles}件
        </div>
      )}

      {/* Grid */}
      {paginatedArticles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
            {paginatedArticles.map((article) => {
              const encodedId = Buffer.from(article.id).toString('base64url');
              return (
                <ArticleCard key={article.id} article={article} encodedId={encodedId} />
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              padding: '20px 0',
            }}>
              {currentPage > 1 && (
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px',
                    color: '#374151',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  ← 前へ
                </Link>
              )}

              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                {currentPage} / {totalPages} ページ
              </span>

              {currentPage < totalPages && (
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '8px',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  次へ →
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white/5 rounded-2xl glass-card">
          <p className="text-gray-400 mb-4">
            {query ? `「${params.q}」に一致する記事が見つかりませんでした。` : '記事が見つかりませんでした。'}
          </p>
          {!query && (
            <p className="text-sm text-gray-500">
              データ収集スクリプトを実行してください: <br />
              <code>npm run update-content</code>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
