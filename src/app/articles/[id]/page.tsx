
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

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-primary mb-8 transition-colors">
                ← ホームに戻る
            </Link>

            {/* Header Section */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wider 
            ${article.category === 'AI' ? 'bg-blue-50 text-blue-600' :
                            article.category === 'Science' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                        {article.category || 'General'}
                    </span>
                    <span className="text-gray-500 text-sm">
                        {format(new Date(article.publishedAt), 'yyyy年MM月dd日', { locale: ja })}
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight mb-4">
                    {article.titleJa || article.title}
                </h1>
                <h2 className="text-xl text-gray-500 font-medium leading-relaxed">
                    Original: {article.title}
                </h2>
            </header>

            {/* Content Section */}
            <div className="space-y-12">

                {/* Explanation */}
                <section className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-primary mb-4">
                        <span>🌱</span> ひとこと解説
                    </h3>
                    <p className="text-gray-700 leading-8 text-lg">
                        {article.explanationJa || '解説を読み込んでいます...'}
                    </p>
                </section>

                {/* Summary */}
                <section>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                        <span>📝</span> 要約
                    </h3>
                    <p className="text-gray-600 leading-8 whitespace-pre-line">
                        {article.summaryJa || article.summary}
                    </p>
                </section>

                {/* Translation */}
                <section>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-secondary mb-4">
                        <span>📖</span> 原文の日本語訳
                    </h3>
                    <div className="bg-orange-50/30 p-8 rounded-2xl whitespace-pre-line text-gray-700 leading-8">
                        {article.translationJa || article.summaryJa || '翻訳データが見つかりませんでした。'}
                    </div>
                </section>

                {/* Insight */}
                {article.insightJa && (
                    <section className="bg-purple-50/50 p-8 rounded-2xl border border-purple-100">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-purple-700 mb-4">
                            <span>💡</span> 日常・ビジネスへの示唆
                        </h3>
                        <p className="text-gray-700 leading-8 text-lg">
                            {article.insightJa}
                        </p>
                    </section>
                )}

                {/* Recommended Books (Amazon Affiliate) */}
                {article.recommendedBooks && article.recommendedBooks.length > 0 && (
                    <section style={{ backgroundColor: '#FFFBEB', padding: '24px', borderRadius: '16px', border: '1px solid #FDE68A' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold', color: '#D97706', marginBottom: '16px' }}>
                            <span>📚</span> 関連書籍
                        </h3>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '12px' }}>
                            このトピックをさらに深く学びたい方へ
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {article.recommendedBooks.map((book, index) => (
                                <a
                                    key={index}
                                    href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(book)}&tag=your-associate-id-22`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        backgroundColor: '#FF9900',
                                        color: 'white',
                                        borderRadius: '9999px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        textDecoration: 'none',
                                        transition: 'background-color 0.2s',
                                    }}
                                >
                                    🔍 {book}
                                </a>
                            ))}
                        </div>
                        <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px' }}>
                            ※ Amazonアソシエイトプログラムのリンクです
                        </p>
                    </section>
                )}

                {/* Action Button */}
                <div className="flex justify-center pt-8">
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary hover:bg-[#7e948a] text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                    >
                        元の論文/記事を読む
                    </a>
                </div>

            </div>
        </div>
    );
}
