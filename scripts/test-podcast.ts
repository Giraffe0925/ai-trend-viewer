/**
 * Test Gemini Multi-Speaker Podcast Generation
 */
import fs from 'fs';
import path from 'path';
import { generatePodcastAudio } from './podcast/generate';
import { Article } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'posts.json');

async function testMultiSpeakerPodcast() {
    console.log('=== Gemini Multi-Speaker Podcast Test ===\n');

    // Load existing articles
    console.log('1. Loading articles...');
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const articles: Article[] = JSON.parse(data);

    // Find first article without audioUrl or get the first one
    const article = articles.find(a => !a.audioUrl) || articles[0];

    if (!article) {
        console.log('No articles found');
        return;
    }

    console.log(`2. Selected article: ${article.titleJa || article.title}\n`);

    // Generate podcast
    console.log('3. Generating discussion-style podcast...\n');
    const audioUrl = await generatePodcastAudio(article);

    if (audioUrl) {
        console.log(`\n✅ SUCCESS! Audio URL: ${audioUrl}`);

        // Update article with audioUrl
        const updatedArticles = articles.map(a =>
            a.id === article.id ? { ...a, audioUrl } : a
        );

        fs.writeFileSync(DATA_FILE, JSON.stringify(updatedArticles, null, 2));
        console.log('4. Updated posts.json with audioUrl\n');
    } else {
        console.log('\n❌ FAILED: No audio generated');
    }

    console.log('=== Test Complete ===');
}

testMultiSpeakerPodcast().catch(console.error);
