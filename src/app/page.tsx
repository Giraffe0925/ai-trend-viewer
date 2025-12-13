
import { Article } from '@/types';
import ArticleCard from '@/components/ArticleCard';
import fs from 'fs';
import path from 'path';

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
  searchParams: Promise<{ q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = params.q?.toLowerCase() || '';

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

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-16">
        <h2 className="text-4xl font-bold tracking-tight text-gray-700">
          未来のヒントを、<br />
          <span className="text-primary">優しく</span> お届けします。
        </h2>
        <p className="text-gray-500 max-w-lg mx-auto leading-loose">
          AI、科学、哲学。<br />
          ちょっと難しい最先端のトレンドを、<br />
          AIが分かりやすく翻訳・要約して毎朝お届け。
        </p>
      </section>

      {/* Search Results Info */}
      {query && (
        <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
          「{params.q}」の検索結果: {sortedArticles.length}件
        </div>
      )}

      {/* Grid */}
      {sortedArticles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
          {sortedArticles.map((article) => {
            const encodedId = Buffer.from(article.id).toString('base64url');
            return (
              <ArticleCard key={article.id} article={article} encodedId={encodedId} />
            );
          })}
        </div>
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
