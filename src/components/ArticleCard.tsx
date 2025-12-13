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

    // Mobile-responsive card - vertical layout on small screens
    const cardStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column', // Vertical on mobile by default
        minHeight: '200px',
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.3s ease',
        textDecoration: 'none',
        color: 'inherit',
    };

    const imageContainerStyle: React.CSSProperties = {
        width: '100%',
        height: '120px',
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
        marginBottom: '8px',
        flexWrap: 'wrap',
        gap: '4px',
    };

    const categoryStyle: React.CSSProperties = {
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '11px',
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
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#1F2937',
        lineHeight: '1.5',
        marginBottom: '8px',
        // Allow multiple lines to display
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 3, // Show up to 3 lines
        WebkitBoxOrient: 'vertical',
    };

    const footerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    };

    const sourceStyle: React.CSSProperties = {
        fontSize: '10px',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '60%',
    };

    return (
        <Link href={`/articles/${encodedId}`} style={cardStyle}>
            <div style={imageContainerStyle}>
                <img src={imageUrl} alt={article.titleJa || article.title} style={imageStyle} />
            </div>
            <div style={contentStyle}>
                <div>
                    <div style={headerStyle}>
                        <span style={categoryStyle}>{article.category || 'General'}</span>
                        <span style={dateStyle}>
                            {format(new Date(article.publishedAt), 'yyyy.MM.dd', { locale: ja })}
                        </span>
                    </div>
                    <h3 style={titleStyle}>{article.titleJa || article.title}</h3>
                </div>
                <div style={footerStyle}>
                    <span style={sourceStyle}>
                        出典：{article.author || article.source}
                    </span>
                    <span style={{ fontSize: '12px', color: '#8BA89A', flexShrink: 0 }}>詳細 →</span>
                </div>
            </div>
        </Link>
    );
};

export default ArticleCard;
