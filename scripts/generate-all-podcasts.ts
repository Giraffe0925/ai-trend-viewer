/**
 * Generate podcasts for ALL articles that don't have one
 */
import fs from 'fs';
import path from 'path';
import { generatePodcastAudio } from './podcast/generate';
import { Article } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'posts.json');

async function generateAllPodcasts() {
    console.log('=== Generating Podcasts for All Articles ===\n');

    // Load existing articles
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const articles: Article[] = JSON.parse(data);

    // Find articles without audioUrl
    const articlesWithoutAudio = articles.filter(a => !a.audioUrl);

    console.log(`Total articles: ${articles.length}`);
    console.log(`Articles needing podcast: ${articlesWithoutAudio.length}\n`);

    if (articlesWithoutAudio.length === 0) {
        console.log('All articles already have podcasts!');
        return;
    }

    // Generate podcasts for each article
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < articlesWithoutAudio.length; i++) {
        const article = articlesWithoutAudio[i];
        console.log(`[${i + 1}/${articlesWithoutAudio.length}] ${(article.titleJa || article.title).slice(0, 40)}...`);

        try {
            const audioUrl = await generatePodcastAudio(article);

            if (audioUrl) {
                // Update article in original array
                const idx = articles.findIndex(a => a.id === article.id);
                if (idx !== -1) {
                    articles[idx].audioUrl = audioUrl;
                }
                successCount++;
                console.log(`  ✅ Success: ${audioUrl}\n`);
            } else {
                failCount++;
                console.log(`  ❌ Failed\n`);
            }
        } catch (error) {
            failCount++;
            console.log(`  ❌ Error: ${error}\n`);
        }

        // Rate limiting - wait 3 seconds between requests
        if (i < articlesWithoutAudio.length - 1) {
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    // Save updated articles
    fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));

    console.log('\n=== Complete ===');
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Total with audio: ${articles.filter(a => a.audioUrl).length}`);
}

generateAllPodcasts().catch(console.error);
