
import fs from 'fs';
import path from 'path';
import { fetchArxivPapers } from './fetchers/arxiv';
import { fetchRSS } from './fetchers/rss';
import { processArticleWithLLM } from './processor/llm';
import { fetchPexelsImage } from './utils/pexels';
import { Article } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'posts.json');

async function main() {
    console.log('Starting content update...');

    // 1. Fetch from various sources
    const arxivAI = await fetchArxivPapers('cs.AI', 3);
    const arxivPhysics = await fetchArxivPapers('physics', 2);

    // Science feeds
    const scienceDaily = await fetchRSS('https://www.sciencedaily.com/rss/mind_brain.xml', 'Science');

    // AI Tech Company & Startup News
    const openAIBlog = await fetchRSS('https://openai.com/blog/rss/', 'AI');
    const anthropicNews = await fetchRSS('https://www.anthropic.com/rss.xml', 'AI');
    const techCrunchAI = await fetchRSS('https://techcrunch.com/category/artificial-intelligence/feed/', 'AI');
    const theVergeAI = await fetchRSS('https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', 'AI');
    const venturebeat = await fetchRSS('https://venturebeat.com/category/ai/feed/', 'AI');

    let articles: Article[] = [
        ...arxivAI.articles,
        ...arxivPhysics.articles,
        ...scienceDaily.articles,
        ...openAIBlog.articles,
        ...anthropicNews.articles,
        ...techCrunchAI.articles,
        ...theVergeAI.articles,
        ...venturebeat.articles
    ];

    console.log(`Fetched ${articles.length} articles.`);

    // 2. Process (only process new ones or all? For demo, all. In prod, check IDs)
    // Check against existing IDs to avoid re-processing
    let existingArticles: Article[] = [];
    if (fs.existsSync(DATA_FILE)) {
        existingArticles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
    const existingIds = new Set(existingArticles.map(a => a.id));

    const newArticles = articles.filter(a => !existingIds.has(a.id));
    console.log(`${newArticles.length} new articles to process.`);

    const processedArticles: Article[] = [];
    for (const article of newArticles) {
        console.log(`Processing: ${article.title}`);
        let processed = await processArticleWithLLM(article);

        // Fetch image from Pexels based on article tags
        const pexelsImage = await fetchPexelsImage(processed);
        if (pexelsImage) {
            processed.imageUrl = pexelsImage;
        } else {
            // Fallback to Picsum if Pexels fails
            const idHash = processed.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            processed.imageUrl = `https://picsum.photos/seed/${idHash}/400/300`;
        }

        processedArticles.push(processed);
        // Add delay to avoid rate limits
        await new Promise(r => setTimeout(r, 1500));
    }

    // 3. Save
    const allArticles = [...processedArticles, ...existingArticles]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 50); // Keep last 50

    fs.writeFileSync(DATA_FILE, JSON.stringify(allArticles, null, 2));
    console.log('Content update complete.');
}

main().catch(console.error);
