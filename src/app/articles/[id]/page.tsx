
import React from 'react';
import { getArticleById } from '@/utils/articles';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ArticleDetailPage({ params }: PageProps) {
    // Decode ID
    const resolvedParams = await params;
    let id = resolvedParams.id;
    try {
        id = Buffer.from(id, 'base64url').toString('utf-8');
    } catch (e) {
        // Handling invalid encoding if necessary
    }

    const article = getArticleById(id);

    if (!article) {
        notFound();
    }

    // Category color mapping
    const getCategoryStyle = (category: string | undefined) => {
        switch (category) {
            case 'AI': return 'bg-blue-50 text-blue-600';
            case '認知科学': return 'bg-purple-50 text-purple-600';
            case '哲学': return 'bg-amber-50 text-amber-700';
            case '経済学': return 'bg-green-50 text-green-600';
            case '社会': return 'bg-rose-50 text-rose-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-primary mb-8 transition-colors">
                ← ホームに戻る
            </Link>

            {/* Hero Image */}
            {article.imageUrl && (
                <div style={{
                    width: '100%',
                    height: '280px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '32px',
                }}>
                    <img
                        src={article.imageUrl}
                        alt={article.titleJa || article.title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                </div>
            )}

            {/* Header Section */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wider ${getCategoryStyle(article.category)}`}>
                        {article.category || 'General'}
                    </span>
                    <span className="text-gray-400 text-sm">
                        {format(new Date(article.publishedAt), 'yyyy年MM月dd日', { locale: ja })}
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight mb-3">
                    {article.titleJa || article.title}
                </h1>
                {article.explanationJa && (
                    <p className="text-lg text-gray-500 leading-relaxed">
                        {article.explanationJa}
                    </p>
                )}
            </header>

            {/* Overview Section - What the source says */}
            <section style={{
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px',
                borderLeft: '4px solid #94a3b8',
            }}>
                <h2 style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#64748b',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}>
                    📄 元記事の概要
                </h2>
                <div style={{
                    fontSize: '16px',
                    lineHeight: 1.9,
                    color: '#475569',
                    whiteSpace: 'pre-line',
                }}>
                    {article.summaryJa || article.summary}
                </div>
            </section>

            {/* Commentary Section - Author's opinion */}
            {article.translationJa && (
                <section style={{
                    marginBottom: '48px',
                }}>
                    <h2 style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#6366f1',
                        marginBottom: '24px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        💭 私見
                    </h2>
                    <article className="prose prose-lg max-w-none">
                        <div style={{
                            fontSize: '17px',
                            lineHeight: 2,
                            color: '#374151',
                            whiteSpace: 'pre-line',
                        }}>
                            {article.translationJa}
                        </div>
                    </article>
                </section>
            )}

            {/* Original Link */}
            <div style={{
                paddingTop: '24px',
                borderTop: '1px solid #e5e7eb',
            }}>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
                    原文を読む
                </p>
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        fontSize: '14px',
                        color: '#3b82f6',
                        wordBreak: 'break-all',
                    }}
                >
                    {article.url}
                </a>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
                <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                }}>
                    {article.tags.map((tag, index) => (
                        <span key={index} style={{
                            padding: '4px 12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            color: '#6b7280',
                        }}>
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
