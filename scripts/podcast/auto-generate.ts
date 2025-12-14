
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { generatePodcastAudio } from './generate';
import { Article } from '../../src/types';

const POSTS_PATH = path.join(process.cwd(), 'data', 'posts.json');

async function main() {
    console.log('Starting podcast auto-generation...');

    // Load posts
    if (!fs.existsSync(POSTS_PATH)) {
        console.error('posts.json not found');
        process.exit(1);
    }

    const posts: Article[] = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));

    // Sort by date desc
    posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Find latest post without audio
    const targetPost = posts.find(p => !p.audioUrl);

    if (!targetPost) {
        console.log('No new articles to process. All articles have audio.');
        return;
    }

    console.log(`Found target article: ${targetPost.title} (${targetPost.id})`);

    try {
        // Generate audio
        const audioUrl = await generatePodcastAudio(targetPost);

        if (audioUrl) {
            console.log(`Audio generated successfully: ${audioUrl}`);

            // Update post data
            targetPost.audioUrl = audioUrl;

            // Save updated posts.json
            fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2), 'utf-8');
            console.log('Updated posts.json with new audio URL.');
        } else {
            console.error('Failed to generate audio.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error during auto-generation:', error);
        process.exit(1);
    }
}

main();
