/**
 * Test script: Generate one new article with podcast audio
 */
import fs from 'fs';
import path from 'path';
import { fetchArxivPapers } from './fetchers/arxiv';
import { processArticleWithLLM } from './processor/llm';
import { fetchPexelsImage } from './utils/pexels';
import { generatePodcastAudio } from './podcast/generate';
import { Article } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'posts.json');

async function testPodcast() {
    console.log('=== Podcast Test ===\n');

    // 1. Fetch one new article
    console.log('1. Fetching one article from ArXiv...');
    const papers = await fetchArxivPapers('cs.AI', 1);

    if (papers.length === 0) {
        console.error('No papers found');
        return;
    }

    const article = papers[0];
    console.log(`   Found: ${article.title}\n`);

    // 2. Process with LLM
    console.log('2. Processing with LLM...');
    let processed = await processArticleWithLLM(article);
    console.log(`   Title: ${processed.titleJa || processed.title}\n`);

    // 3. Fetch image
    console.log('3. Fetching image from Pexels...');
    const imageUrl = await fetchPexelsImage(processed.tags?.[0] || 'AI');
    if (imageUrl) {
        processed.imageUrl = imageUrl;
        console.log(`   Image: ${imageUrl}\n`);
    } else {
        const idHash = processed.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        processed.imageUrl = `https://picsum.photos/seed/${idHash}/400/300`;
    }

    // 4. Generate podcast audio
    console.log('4. Generating podcast audio...');
    const audioUrl = await generatePodcastAudio(processed);

    if (audioUrl) {
        processed.audioUrl = audioUrl;
        console.log(`   Audio: ${audioUrl}\n`);
    } else {
        console.log('   Audio generation failed or skipped\n');
    }

    // 5. Load existing data and add new article
    console.log('5. Saving to posts.json...');
    let existingArticles: Article[] = [];
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        existingArticles = JSON.parse(data);
    }

    // Remove duplicate if exists
    existingArticles = existingArticles.filter(a => a.id !== processed.id);

    // Add new article at the beginning
    const allArticles = [processed, ...existingArticles]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 50);

    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(allArticles, null, 2));
    console.log(`   Saved ${allArticles.length} articles\n`);

    console.log('=== Test Complete ===');
    console.log(`Article ID: ${processed.id}`);
    console.log(`Has audioUrl: ${!!processed.audioUrl}`);
}

testPodcast().catch(console.error);
