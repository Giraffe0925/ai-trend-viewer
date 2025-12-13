
import { Article } from '../types';
import fs from 'fs';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

interface TTSRequest {
    input: { text: string };
    voice: {
        languageCode: string;
        name: string;
        ssmlGender: string;
    };
    audioConfig: {
        audioEncoding: string;
        speakingRate: number;
        pitch: number;
    };
}

/**
 * Generate podcast audio from article content using Google Cloud TTS
 */
export async function generatePodcastAudio(article: Article): Promise<string | null> {
    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY || '';

    console.log('TTS API Key check:', {
        exists: !!apiKey,
        length: apiKey.length,
        start: apiKey.substring(0, 5)
    });

    if (!apiKey) {
        console.warn('GOOGLE_CLOUD_TTS_API_KEY not found, skipping podcast generation');
        return null;
    }

    // Ensure audio directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    // Create the script for the podcast
    const title = article.titleJa || article.title;
    const overview = article.summaryJa || '';
    const commentary = article.translationJa || '';

    const podcastScript = `
${title}。

まず、この研究の概要をお伝えします。

${overview}

続いて、私の見解を述べます。

${commentary}

ご視聴ありがとうございました。
    `.trim();

    try {
        // Google Cloud TTS API request
        const request: TTSRequest = {
            input: { text: podcastScript },
            voice: {
                languageCode: 'ja-JP',
                name: 'ja-JP-Neural2-B', // Male neural voice
                ssmlGender: 'MALE',
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.95, // Slightly slower for clarity
                pitch: -1.0, // Slightly lower pitch for gravitas
            },
        };

        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('TTS API error:', error);
            return null;
        }

        const data = await response.json();
        const audioContent = data.audioContent;

        if (!audioContent) {
            console.error('No audio content received');
            return null;
        }

        // Save as MP3 file
        const filename = `podcast_${Buffer.from(article.id).toString('base64url')}.mp3`;
        const filepath = path.join(AUDIO_DIR, filename);

        fs.writeFileSync(filepath, Buffer.from(audioContent, 'base64'));
        console.log(`Podcast generated: ${filename}`);

        return `/audio/${filename}`;
    } catch (error) {
        console.error('Failed to generate podcast:', error);
        return null;
    }
}

/**
 * Generate podcast for multiple articles
 */
export async function generatePodcastsForArticles(articles: Article[]): Promise<void> {
    console.log(`Generating podcasts for ${articles.length} articles...`);

    for (const article of articles) {
        // Skip if audio already exists
        const filename = `podcast_${Buffer.from(article.id).toString('base64url')}.mp3`;
        const filepath = path.join(AUDIO_DIR, filename);

        if (fs.existsSync(filepath)) {
            console.log(`Podcast already exists: ${filename}`);
            continue;
        }

        await generatePodcastAudio(article);

        // Rate limiting
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('Podcast generation complete.');
}
