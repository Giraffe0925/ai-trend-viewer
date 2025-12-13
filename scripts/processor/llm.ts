
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
    あなたは哲学的な視点を持つ知識人です。
    以下の学術論文の要約を読み、日本語で論評を書いてください。
    
    【スタイルの指示】
    - ウィトゲンシュタインが語るような、静かで思慮深いトーンで
    - 問いを投げかけつつ、仮説や仮定に基づいた考察も述べる
    - 堅苦しいセクション分けはせず、自然に流れるエッセイのように
    - 研究の背景、アプローチ、発見について触れつつ、それらへの論評を織り交ぜる
    - 断定しすぎず、「〜かもしれない」「〜ではないだろうか」といった表現を使う
    - 言葉の意味、概念の前提、問いの立て方そのものを吟味する
    - 最後に、この知見が私たちの世界観にどう影響するかを考察する
    
    Title: ${article.title}
    Abstract: ${article.originalContent}

    【出力形式】
    有効なJSONを出力してください。以下のキーを含めること：
    - titleJa: 日本語タイトル（HTMLなし、簡潔に）
    - commentary: 上記スタイルで書かれた論評エッセイ（800-1200文字程度、段落で区切る。HTMLは使わない）
    - oneLiner: 一般読者向けの一言解説（50-80文字）
    - tags: 関連キーワード3-5個（英語または日本語の配列）

    \`\`\`json のようなMarkdown記法は含めず、純粋なJSONのみを出力すること。
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
                summaryJa: processed.commentary || article.summary,
                explanationJa: processed.oneLiner || '解説を生成できませんでした。',
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
