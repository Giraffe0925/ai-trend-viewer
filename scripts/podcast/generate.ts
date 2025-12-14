/**
 * ElevenLabs Multi-Speaker Podcast Generator (Improved)
 * 
 * 10-15 minute podcasts with high-quality Japanese voices
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Article } from '../types';
import fs from 'fs';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

// Japanese-specific voices for natural intonation
const VOICES = {
    // Sakura Suzuki - young Japanese female, ideal for podcasts
    host: 'RBnMinrYKeccY3vaUxlZ',
    // Kenzo - calm professional male Japanese voice
    guest: 'b34JylakFZPlGS0BnwyY',
};

interface ConversationTurn {
    speaker: 'ホスト' | 'ゲスト';
    text: string;
}

/**
 * Generate a long conversation script (10-15 min) from article content
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
    const commentary = article.translationJa || '';

    const prompt = `
あなたは知的なラジオ番組「日々知読」の脚本家です。以下の記事内容をもとに、ホスト（若い女性）とゲスト（専門家の男性）が深く議論する10-15分のポッドキャスト台本を作成してください。

## 記事タイトル
${title}

## 記事概要
${overview}

## 詳細解説
${commentary}

## 番組構成（必ずこの流れで）

### オープニング（約1分）
- ホストが番組名と今回のテーマを紹介
- ゲストを紹介

### 本編パート1：概要説明（約3分）
- この研究/ニュースの背景
- 何が起きたのか、何が発見されたのか

### 本編パート2：深掘り（約4分）
- なぜこれが重要なのか
- 技術的/学術的な詳細
- 具体例や比喩を交えた説明

### 本編パート3：考察（約4分）
- 社会への影響
- 今後の展望
- 批判的な視点や別の見方

### エンディング（約1分）
- まとめ
- リスナーへのメッセージ
- 次回予告（省略可）

## 台本の指示
- 合計30-40ターンの会話
- 各発言は2-4文、80-150文字程度
- ホストは親しみやすく、質問と相槌が上手
- ゲストは専門知識を分かりやすく解説
- 「なるほど」「それは興味深いですね」など自然な相槌
- 専門用語は説明を加える
- リスナーに語りかける表現も入れる

## 出力形式（JSON配列のみ）
[
  {"speaker": "ホスト", "text": "皆さん、こんにちは。「日々知読」の時間です。..."},
  {"speaker": "ゲスト", "text": "..."},
  ...
]

JSONのみを出力してください。
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
                        stability: 0.6,
                        similarity_boost: 0.8,
                        style: 0.3,
                        use_speaker_boost: true,
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
 * Concatenate audio buffers
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

    console.log('Generating 10-15 min podcast for:', article.titleJa || article.title);

    // Ensure audio directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    // Step 1: Generate conversation script
    console.log('Step 1: Generating conversation script...');
    const conversation = await generateConversationScript(article);

    if (conversation.length === 0) {
        console.warn('Failed to generate conversation script');
        return null;
    }

    console.log(`Generated ${conversation.length} turns of conversation`);

    // Calculate estimated length
    const totalChars = conversation.reduce((sum, t) => sum + t.text.length, 0);
    console.log(`Total characters: ${totalChars} (est. ${Math.round(totalChars / 200)} minutes)`);

    // Step 2: Generate audio for each turn
    console.log('Step 2: Generating audio for each turn...');
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < conversation.length; i++) {
        const turn = conversation[i];
        const voiceId = turn.speaker === 'ホスト' ? VOICES.host : VOICES.guest;

        console.log(`  [${i + 1}/${conversation.length}] ${turn.speaker}: ${turn.text.slice(0, 30)}...`);

        const audioBuffer = await generateSpeakerAudio(turn.text, voiceId, elevenLabsKey);

        if (audioBuffer) {
            audioBuffers.push(audioBuffer);
        } else {
            console.warn(`  Failed to generate audio for turn ${i + 1}`);
        }

        // Rate limiting - 200ms between requests
        await new Promise(r => setTimeout(r, 200));
    }

    if (audioBuffers.length === 0) {
        console.error('No audio generated');
        return null;
    }

    console.log(`Generated ${audioBuffers.length} audio segments`);

    // Step 3: Concatenate audio files
    console.log('Step 3: Combining audio...');
    const combinedAudio = concatenateAudioBuffers(audioBuffers);

    // Step 4: Save as MP3 file
    const filename = `podcast_${Buffer.from(article.id).toString('base64url')}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    fs.writeFileSync(filepath, combinedAudio);

    const fileSizeMB = (combinedAudio.length / 1024 / 1024).toFixed(2);
    console.log(`Podcast saved: ${filename} (${fileSizeMB} MB)`);

    return `/audio/${filename}`;
}
