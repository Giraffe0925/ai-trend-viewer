
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Article } from '../types';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function processArticleWithLLM(article: Article): Promise<Article> {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY not found, skipping LLM processing');
        return article;
    }

    // Debug info
    console.log('API Key config:', {
        exists: !!process.env.GEMINI_API_KEY,
        length: process.env.GEMINI_API_KEY?.length,
        start: process.env.GEMINI_API_KEY?.substring(0, 5)
    });

    const candidateModels = [
        'models/gemini-2.0-flash',
        'models/gemini-flash-latest',
        'models/gemini-pro-latest',
        'models/gemini-2.0-flash-lite'
    ];

    const prompt = `
    You are an expert science communicator.
    Analyze the following academic paper's abstract and provide a comprehensive Japanese translation and explanation.
    
    IMPORTANT: The original content may contain HTML tags, links, or code snippets. 
    You MUST remove ALL HTML tags, URLs, and code-like formatting from your output.
    Provide clean, readable Japanese text only.
    
    Title: ${article.title}
    Abstract: ${article.originalContent}

    Output valid JSON with the following keys:
    - titleJa: Japanese translation of the title (clean text, no HTML)
    - summaryJa: A comprehensive summary covering the ENTIRE paper's scope - include: (1) research problem/motivation, (2) methodology/approach, (3) key findings/results, (4) conclusions/implications. Write in flowing paragraphs, approx 400-600 chars. Use polite "desu/masu" style.
    - explanationJa: A simple one-sentence explanation for a general audience (use polite "desu/masu" style, approx 50-80 chars)
    - translationJa: A detailed Japanese translation of the abstract that helps readers understand the full paper without reading the original. Include context and explain technical terms. Approx 500-800 chars, clean text, NO HTML.
    - insightJa: A short insight on how this topic might impact everyday life or business (use polite "desu/masu" style, 1-2 sentences, approx 80-120 chars)
    - recommendedBooks: An array of 2-3 related book search keywords in Japanese (e.g. ["人工知能 入門", "機械学習 ビジネス"])
    - tags: An array of 3-5 relevant keywords (in English or Japanese)

    Do not include Markdown formatting like \`\`\`json. Just the raw JSON string.
  `;

    let lastError;

    for (const modelName of candidateModels) {
        try {
            console.log(`Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

            const processed = JSON.parse(text);
            console.log(`Success with model: ${modelName}`);

            return {
                ...article,
                titleJa: processed.titleJa || article.title,
                summaryJa: processed.summaryJa || article.summary,
                explanationJa: processed.explanationJa || '解説を生成できませんでした。',
                translationJa: processed.translationJa || '',
                insightJa: processed.insightJa || '',
                recommendedBooks: processed.recommendedBooks || [],
                tags: processed.tags || [],
            };
        } catch (error: any) {
            console.warn(`Failed with model ${modelName}: ${error.message}`);
            lastError = error;
            // Continue to next model
        }
    }

    console.error(`All models failed for article ${article.id}. Last error:`, lastError);
    return article;
}
