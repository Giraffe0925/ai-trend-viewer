
import fs from 'fs';
import path from 'path';
import { Article } from '@/types';

export const getArticles = (): Article[] => {
    try {
        const filePath = path.join(process.cwd(), 'data', 'posts.json');
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Failed to load articles:', error);
        return [];
    }
};

export const getArticleById = (id: string): Article | undefined => {
    const articles = getArticles();
    // We assume IDs match exactly. If we use Base64 encoding for routing, 
    // the caller is responsible for decoding before calling this, 
    // OR we find by comparison.
    return articles.find(article => article.id === id);
};
