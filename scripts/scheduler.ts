
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
    // 🤖 AI - AGI, AI安全性, 機械学習
    // ============================================
    const arxivAI = await fetchArxivPapers('cs.AI', 4);        // Artificial Intelligence
    const arxivML = await fetchArxivPapers('cs.LG', 3);        // Machine Learning
    const arxivCL = await fetchArxivPapers('cs.CL', 2);        // Computation and Language (NLP/LLM)

    // ============================================
    // 🧠 意識・知性・認知科学
    // ============================================
    const arxivNeuro = await fetchArxivPapers('q-bio.NC', 3);  // Neurons and Cognition
    const arxivCogSci = await fetchArxivPapers('cs.HC', 2);    // Human-Computer Interaction (認知的側面)

    // ============================================
    // 🧬 脳神経科学・心理学
    // ============================================
    const arxivQuantBio = await fetchArxivPapers('q-bio.QM', 2); // Quantitative Biology Methods

    // ============================================
    // 💭 哲学 - 心身問題、認識論、言語哲学
    // ============================================
    const arxivPhilPh = await fetchArxivPapers('physics.hist-ph', 2); // History and Philosophy of Physics
    const philPapers = await fetchRSS('https://philpapers.org/recent.rss', 'Philosophy');

    // ============================================
    // 🌍 社会 - 行動経済学、地政学×AI
    // ============================================
    const arxivEcon = await fetchArxivPapers('econ.GN', 2);    // Economics - General
    const arxivSocial = await fetchArxivPapers('cs.CY', 2);    // Computers and Society (AI倫理・社会影響)

    // Combine all sources
    let articles: Article[] = [
        // AI Core
        ...arxivAI.articles,
        ...arxivML.articles,
        ...arxivCL.articles,
        // Consciousness & Cognition
        ...arxivNeuro.articles,
        ...arxivCogSci.articles,
        ...arxivQuantBio.articles,
        // Philosophy
        ...arxivPhilPh.articles,
        ...philPapers.articles,
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
        // Add delay to avoid rate limits
        await new Promise(r => setTimeout(r, 1500));
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
