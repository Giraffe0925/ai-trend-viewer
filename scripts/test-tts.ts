/**
 * Simple TTS test: generate podcast for first existing article
 */
import fs from 'fs';
import path from 'path';
import { generatePodcastAudio } from './podcast/generate';
import { Article } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'posts.json');

async function testTTS() {
    console.log('=== TTS Test ===\n');

    // Load existing articles
    console.log('1. Loading existing articles...');
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const articles: Article[] = JSON.parse(data);
    console.log(`   Found ${articles.length} articles\n`);

    // Find first article without audioUrl
    const article = articles.find(a => !a.audioUrl);

    if (!article) {
        console.log('All articles already have audioUrl');
        return;
    }

    console.log(`2. Testing with: ${article.titleJa || article.title}\n`);
    console.log(`   ID: ${article.id}`);
    console.log(`   Has summaryJa: ${!!article.summaryJa}`);
    console.log(`   Has translationJa: ${!!article.translationJa}\n`);

    // Generate podcast
    console.log('3. Generating podcast audio...');
    const audioUrl = await generatePodcastAudio(article);

    if (audioUrl) {
        console.log(`   SUCCESS! Audio URL: ${audioUrl}\n`);

        // Update the article with audioUrl
        const updatedArticles = articles.map(a =>
            a.id === article.id ? { ...a, audioUrl } : a
        );

        fs.writeFileSync(DATA_FILE, JSON.stringify(updatedArticles, null, 2));
        console.log('4. Updated posts.json with audioUrl\n');
    } else {
        console.log('   FAILED: No audio generated\n');
    }

    console.log('=== Test Complete ===');
}

testTTS().catch(console.error);
