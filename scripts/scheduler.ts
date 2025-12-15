
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
    const googleAIBlog = await fetchRSS('https://research.google/blog/rss', 'AI');
    const wiredAI = await fetchRSS('https://www.wired.com/feed/tag/ai/latest/rss', 'AI');
    const mitTechReview = await fetchRSS('https://www.technologyreview.com/feed', 'AI');

    // ============================================
    // 🔬 科学・技術 - マガジン
    // ============================================
    const quantaMag = await fetchRSS('https://api.quantamagazine.org/feed/', '認知科学');

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

    // ============================================
    // 💰 経済・社会 - ブログ
    // ============================================
    const marginalRevolution = await fetchRSS('http://feeds.feedburner.com/marginalrevolution/feed', '経済学');

    // Combine all sources
    let articles: Article[] = [
        // AI Papers
        ...arxivAI.articles,
        ...arxivML.articles,
        ...arxivCL.articles,
        // AI Blogs & Tech News
        ...lessWrong.articles,
        ...astralCodex.articles,
        ...googleAIBlog.articles,
        ...wiredAI.articles,
        ...mitTechReview.articles,
        // Science & Tech Magazines
        ...quantaMag.articles,
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
        ...marginalRevolution.articles,
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

    // ============================================
    // Category Rotation Logic: Select 1 article from a different category
    // ============================================
    const ARTICLES_PER_RUN = 1;

    // Get the last article's category to avoid repetition
    const lastCategory = existingArticles.length > 0 ? existingArticles[0].category : null;
    console.log(`Last category: ${lastCategory}`);

    // Group new articles by category
    const articlesByCategory: Record<string, Article[]> = {};
    for (const article of newArticles) {
        const cat = article.category || 'Other';
        if (!articlesByCategory[cat]) {
            articlesByCategory[cat] = [];
        }
        articlesByCategory[cat].push(article);
    }

    // Get all categories except the last one (for rotation)
    const availableCategories = Object.keys(articlesByCategory).filter(cat => cat !== lastCategory);

    // If all new articles are same category as last, use that category anyway
    const categoriesToUse = availableCategories.length > 0 ? availableCategories : Object.keys(articlesByCategory);

    // Select articles to process (1 article from a different category)
    const articlesToProcess: Article[] = [];
    for (const category of categoriesToUse) {
        if (articlesToProcess.length >= ARTICLES_PER_RUN) break;
        const catArticles = articlesByCategory[category];
        if (catArticles && catArticles.length > 0) {
            articlesToProcess.push(catArticles[0]);
        }
    }

    console.log(`Selected ${articlesToProcess.length} article(s) to process (category rotation).`);
    if (articlesToProcess.length === 0) {
        console.log('No new articles to process. Exiting.');
        return;
    }

    const processedArticles: Article[] = [];
    for (const article of articlesToProcess) {
        console.log(`Processing: ${article.title} (Category: ${article.category})`);
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

        // Fetch images for visual suggestions
        if (processed.visualSuggestions && processed.visualSuggestions.length > 0) {
            const { fetchDiagramImages } = await import('./utils/pexels');
            const visualImages = await fetchDiagramImages(processed.visualSuggestions);
            processed.visualImages = visualImages;
        }

        // Generate podcast audio using Gemini TTS
        if (process.env.GEMINI_API_KEY) {
            const { generatePodcastAudio } = await import('./podcast/generate-gemini');
            const audioUrl = await generatePodcastAudio(processed);
            if (audioUrl) {
                processed.audioUrl = audioUrl;
            }
        }

        processedArticles.push(processed);

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
