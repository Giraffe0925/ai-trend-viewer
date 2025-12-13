
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
    あなたは哲学的な視点を持つ知識人であり、エッセイストです。
    以下の学術論文または記事の内容を読み、2つのパートに分けて日本語で書いてください。
    
    Title: ${article.title}
    Content: ${article.originalContent}

    【パート1: 概要】
    元の記事・論文が何を述べているかを客観的に要約してください。
    - 研究の背景・動機
    - アプローチや方法
    - 主な発見・結論
    300-400文字程度、読みやすい文章で。

    【パート2: 論評（本編）】
    これが記事の本編です。上記の概要を受けて、あなたの深い考察を述べてください。
    
    スタイル:
    - ウィトゲンシュタインが語るような、静かで思慮深いトーンで
    - 問いを投げかけつつ、仮説や仮定に基づいた考察も述べる
    - 自然に流れるエッセイのように、書籍の一章を読むような感覚で
    - 断定しすぎず、「〜かもしれない」「〜ではないだろうか」といった表現を使う
    - 言葉の意味、概念の前提を吟味する
    
    構成（5-7段落で書く）:
    1. 導入：この研究が問いかけていることへの第一印象
    2. 概念の吟味：使われている言葉や概念の前提を問う
    3. 仮説の提示：もし〜だとすれば、こうなるのではないか
    4. 批判的考察：この研究の限界や見落とされている視点
    5. 別の視点：異なる角度からの考察
    6. 哲学的示唆：より深い知的問いへの展開
    7. 結び：この知見が私たちの世界観にどう影響するか
    
    各段落は改行で区切り、3000-4000文字程度で書いてください。
    これは論評の本編なので、十分な深さと分量を持たせてください。

    【出力形式】
    有効なJSONを出力してください。以下のキーを含めること：
    - titleJa: 日本語タイトル（HTMLなし、簡潔に）
    - overview: パート1の概要（元記事の客観的要約）
    - commentary: パート2の論評（あなたの見解、3000-4000文字、段落ごとに改行）
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
                summaryJa: processed.overview || article.summary,
                translationJa: processed.commentary || '',
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
