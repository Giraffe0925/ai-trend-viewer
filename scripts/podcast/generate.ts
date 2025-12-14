/**
 * ElevenLabs Multi-Speaker Podcast Generator
 * 
 * Uses Gemini LLM to generate conversation scripts
 * and ElevenLabs API for multi-speaker audio generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Article } from '../types';
import fs from 'fs';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

// ElevenLabs voice IDs for Japanese
// Using multilingual voices that support Japanese
const VOICES = {
    host: 'pFZP5JQG7iQjIQuC4Bku', // Lily - female, warm
    guest: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - male, calm
};

interface ConversationTurn {
    speaker: 'ホスト' | 'ゲスト';
    text: string;
}

/**
 * Generate a conversation script from article content using Gemini LLM
 */
async function generateConversationScript(article: Article): Promise<ConversationTurn[]> {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
        console.warn('GEMINI_API_KEY not found');
        return [];
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const title = article.titleJa || article.title;
    const overview = article.summaryJa || '';
    const commentary = (article.translationJa || '').slice(0, 1000);

    const prompt = `
あなたはラジオ番組の脚本家です。以下の記事内容をもとに、2人のパーソナリティ（ホストとゲスト）が議論する形式の台本を作成してください。

## 記事タイトル
${title}

## 記事概要
${overview}

## 論評（抜粋）
${commentary}

## 指示
- ホストとゲストが交互に話す自然な会話形式で
- 合計6ターンの短いやりとり
- ホストは聞き手として質問や相槌を入れる
- ゲストは專門家として解説する
- 各発言は30-60文字程度で簡潔に
- 最後は「ありがとうございました」で締める
- JSON形式で出力

## 出力形式
[
  {"speaker": "ホスト", "text": "..."},
  {"speaker": "ゲスト", "text": "..."},
  ...
]

JSONのみを出力し、他の説明は不要です。
`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('Failed to extract JSON from response');
            return [];
        }

        const conversation = JSON.parse(jsonMatch[0]) as ConversationTurn[];
        return conversation;
    } catch (error) {
        console.error('Failed to generate conversation script:', error);
        return [];
    }
}

/**
 * Generate audio for a single speaker using ElevenLabs
 */
async function generateSpeakerAudio(
    text: string,
    voiceId: string,
    apiKey: string
): Promise<Buffer | null> {
    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('ElevenLabs API error:', error);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error('Failed to generate speaker audio:', error);
        return null;
    }
}

/**
 * Concatenate audio buffers (simple concatenation for MP3)
 */
function concatenateAudioBuffers(buffers: Buffer[]): Buffer {
    return Buffer.concat(buffers);
}

/**
 * Main function to generate podcast from article
 */
export async function generatePodcastAudio(article: Article): Promise<string | null> {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY || '';
    if (!elevenLabsKey) {
        console.warn('ELEVENLABS_API_KEY not found');
        return null;
    }

    console.log('Generating discussion-style podcast for:', article.titleJa || article.title);

    // Ensure audio directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    // Step 1: Generate conversation script
    const conversation = await generateConversationScript(article);

    if (conversation.length === 0) {
        console.warn('Failed to generate conversation script');
        return null;
    }

    console.log(`Generated ${conversation.length} turns of conversation`);

    // Step 2: Generate audio for each turn
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < conversation.length; i++) {
        const turn = conversation[i];
        const voiceId = turn.speaker === 'ホスト' ? VOICES.host : VOICES.guest;

        console.log(`  [${i + 1}/${conversation.length}] ${turn.speaker}: ${turn.text.slice(0, 20)}...`);

        const audioBuffer = await generateSpeakerAudio(turn.text, voiceId, elevenLabsKey);

        if (audioBuffer) {
            audioBuffers.push(audioBuffer);
        } else {
            console.warn(`  Failed to generate audio for turn ${i + 1}`);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 500));
    }

    if (audioBuffers.length === 0) {
        console.error('No audio generated');
        return null;
    }

    // Step 3: Concatenate audio files
    const combinedAudio = concatenateAudioBuffers(audioBuffers);

    // Step 4: Save as MP3 file
    const filename = `podcast_${Buffer.from(article.id).toString('base64url')}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    fs.writeFileSync(filepath, combinedAudio);
    console.log(`Podcast generated: ${filename}`);

    return `/audio/${filename}`;
}
