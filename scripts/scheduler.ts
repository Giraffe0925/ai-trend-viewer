
import fs from 'fs';
import path from 'path';
import { fetchArxivPapers } from './fetchers/arxiv';
import { fetchRSS } from './fetchers/rss';
import { processArticleWithLLM } from './processor/llm';
import { fetchPexelsImage } from './utils/pexels';
import { postToTwitter } from './utils/twitter';
import { Article } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'posts.json');

async function main() {
    console.log('Starting content update...');

    // ============================================
    // 🤖 AI - AGI, AI安全性, 機械学習 (論文)
    // ============================================
    const arxivAI = await fetchArxivPapers('cs.AI', 3);
    const arxivML = await fetchArxivPapers('cs.LG', 2);
    const arxivCL = await fetchArxivPapers('cs.CL', 2);

    // ============================================
    // 🤖 AI - ブログ・マガジン
    // ============================================
    const lessWrong = await fetchRSS('https://www.lesswrong.com/feed.xml?view=curated', 'AI');
    const astralCodex = await fetchRSS('https://www.astralcodexten.com/feed', 'AI');
    const openAIBlog = await fetchRSS('https://openai.com/blog/rss/', 'AI');
    const anthropicBlog = await fetchRSS('https://www.anthropic.com/rss.xml', 'AI');

    // ============================================
    // 🧠 認知科学・哲学 - ブログ・マガジン
    // ============================================
    const aeonMagazine = await fetchRSS('https://aeon.co/feed.rss', '哲学');
    const nautilusMag = await fetchRSS('https://nautil.us/feed/', '認知科学');

    // ============================================
    // 🧠 認知科学 (論文)
    // ============================================
    const arxivNeuro = await fetchArxivPapers('q-bio.NC', 2);
    const arxivCogSci = await fetchArxivPapers('cs.HC', 2);

    // ============================================
    // 💭 哲学 (論文)
    // ============================================
    const arxivPhilPh = await fetchArxivPapers('physics.hist-ph', 2);

    // ============================================
    // 🌍 社会・経済 (論文)
    // ============================================
    const arxivEcon = await fetchArxivPapers('econ.GN', 2);
    const arxivSocial = await fetchArxivPapers('cs.CY', 2);

    // Combine all sources
    let articles: Article[] = [
        // AI Papers
        ...arxivAI.articles,
        ...arxivML.articles,
        ...arxivCL.articles,
        // AI Blogs
        ...lessWrong.articles,
        ...astralCodex.articles,
        ...openAIBlog.articles,
        ...anthropicBlog.articles,
        // Cognition & Philosophy Magazines
        ...aeonMagazine.articles,
        ...nautilusMag.articles,
        // Cognition Papers
        ...arxivNeuro.articles,
        ...arxivCogSci.articles,
        // Philosophy Papers
        ...arxivPhilPh.articles,
        // Society & Economics
        ...arxivEcon.articles,
        ...arxivSocial.articles,
    ];

    console.log(`Fetched ${articles.length} articles.`);

    // 2. Process (only process new ones)
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

        // Post to Twitter
        const encodedId = Buffer.from(processed.id).toString('base64url');
        const articleUrl = `https://ai-trend-viewer.vercel.app/articles/${encodedId}`;
        await postToTwitter(processed.titleJa || processed.title, processed.category || 'General', articleUrl);

        // Add delay to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
    }

    // 3. Save
    const allArticles = [...processedArticles, ...existingArticles]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 50); // Keep last 50

    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(allArticles, null, 2));
    console.log('Content update complete.');
}

main().catch(console.error);
