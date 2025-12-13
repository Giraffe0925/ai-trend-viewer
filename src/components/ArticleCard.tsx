'use client';

import React from 'react';
import { Article } from '../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';

interface ArticleCardProps {
    article: Article;
    encodedId: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, encodedId }) => {
    // Use article-specific image if available, fallback to category image
    let categoryImage = '/images/philosophy-abstract.png';
    if (article.category === 'AI') {
        categoryImage = '/images/ai-abstract.png';
    } else if (article.category === 'Science') {
        categoryImage = '/images/science-abstract.png';
    }

    const imageUrl = article.imageUrl || categoryImage;

    const cardStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        height: '100px',
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.3s ease',
        textDecoration: 'none',
        color: 'inherit',
    };

    const imageContainerStyle: React.CSSProperties = {
        width: '100px',
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
    };

    const imageStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    };

    const contentStyle: React.CSSProperties = {
        flexGrow: 1,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
    };

    const categoryStyle: React.CSSProperties = {
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '10px',
        fontWeight: 'bold',
        backgroundColor: article.category === 'AI' ? '#EFF6FF' :
            article.category === 'Science' ? '#F0FDF4' : '#FFF7ED',
        color: article.category === 'AI' ? '#2563EB' :
            article.category === 'Science' ? '#16A34A' : '#EA580C',
    };

    const dateStyle: React.CSSProperties = {
        fontSize: '11px',
        color: '#9CA3AF',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#1F2937',
        lineHeight: '1.4',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
    };

    const footerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };

    const sourceStyle: React.CSSProperties = {
        fontSize: '10px',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    return (
        <Link href={`/articles/${encodedId}`} style={cardStyle}>
            <div style={imageContainerStyle}>
                <img src={imageUrl} alt={article.titleJa || article.title} style={imageStyle} />
            </div>
            <div style={contentStyle}>
                <div style={headerStyle}>
                    <span style={categoryStyle}>{article.category || 'General'}</span>
                    <span style={dateStyle}>
                        {format(new Date(article.publishedAt), 'yyyy.MM.dd', { locale: ja })}
                    </span>
                </div>
                <h3 style={titleStyle}>{article.titleJa || article.title}</h3>
                <div style={footerStyle}>
                    <span style={sourceStyle}>
                        出典：{article.author || article.source}
                    </span>
                    <span style={{ fontSize: '12px', color: '#8BA89A' }}>詳細 →</span>
                </div>
            </div>
        </Link>
    );
};

export default ArticleCard;
