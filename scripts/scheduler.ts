
import fs from 'fs';
import path from 'path';
import { fetchArxivPapers } from './fetchers/arxiv';
import { fetchRSS } from './fetchers/rss';
import { processArticleWithLLM } from './processor/llm';
import { Article } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'posts.json');

async function main() {
    console.log('Starting content update...');

    // 1. Fetch
    const arxivAI = await fetchArxivPapers('cs.AI', 3);
    const arxivPhysics = await fetchArxivPapers('physics', 2); // General physics or specific
    // Stanford Encyclopedia of Philosophy (SEP) doesn't have a simple RSS for "new" that is easily parseable always, 
    // but let's try a known philosophy feed or specialized science blog.
    // Scientific American Mind? 
    // For demo, let's use a tech/science RSS.
    const scienceDaily = await fetchRSS('https://www.sciencedaily.com/rss/mind_brain.xml', 'Science');

    let articles: Article[] = [
        ...arxivAI.articles,
        ...arxivPhysics.articles,
        ...scienceDaily.articles
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
        const processed = await processArticleWithLLM(article);
        processedArticles.push(processed);
        // Add delay to avoid rate limits if needed
        await new Promise(r => setTimeout(r, 1000));
    }

    // 3. Save
    const allArticles = [...processedArticles, ...existingArticles]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 50); // Keep last 50

    fs.writeFileSync(DATA_FILE, JSON.stringify(allArticles, null, 2));
    console.log('Content update complete.');
}

main().catch(console.error);
