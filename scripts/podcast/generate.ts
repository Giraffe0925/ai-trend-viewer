/**
 * ElevenLabs Multi-Speaker Podcast Generator (v3)
 * 
 * 10-15 minute podcasts with balanced audio and improved prompts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Article } from '../../src/types';
import { mixWithBGM, adjustVolume } from '../utils/audio-mixer';
import fs from 'fs';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

// Japanese-specific voices for natural intonation
const VOICES = {
    // Sakura Suzuki - young Japanese female, ideal for podcasts
    host: 'RBnMinrYKeccY3vaUxlZ',
    // Charlie - conversational male text-to-speech voice
    guest: 'IKne3meq5aSn9XLyUdCD',
};

// Voice settings optimized for natural Japanese intonation
const VOICE_SETTINGS = {
    host: {
        stability: 0.40,
        similarity_boost: 0.80,
        style: 0.50,
        use_speaker_boost: true,
        speed: 2.5,
        volume: 1.6, // Increased volume
    },
    guest: {
        stability: 0.50,
        similarity_boost: 0.75,
        style: 0.40,
        use_speaker_boost: true,
        speed: 2.5,
        volume: 1.0, // normal volume
    },
};

interface ConversationTurn {
    speaker: 'ホスト' | 'ゲスト';
    text: string;
}

/**
 * Generate a 50-turn conversation script
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
あなたはポッドキャスト「ひびちどく」の脚本家です。以下の記事内容をもとに、ホスト（若い女性）とゲスト（男性）が議論する10-15分のポッドキャスト台本を作成してください。

【重要なルール】
- 番組名は「ひびちどく」とひらがなで読んでください（「日々知読」ではなく）
- ゲストは専門家や大学教授などを名乗らないでください。自己紹介は不要です
- 2人は対等に議論する形式です

## 記事タイトル
${title}

## 記事概要
${overview}

## 詳細解説
${commentary}

## 番組構成（50ターンで）

### オープニング（約5ターン）
1. ホスト:「みなさん、こんにちは！ひびちどくラジオの時間です」（必ずこの挨拶から始める）
2. ホスト: 番組の簡単な紹介「このポッドキャストでは、世界中の面白いニュースや研究を、分かりやすくお届けしています」
3. ホスト: 今回のトピック紹介「さて、今日は〇〇についてお話しします。〜という話題なんですが...」
4. ゲストが興味を示す相槌で本題へ
- 自己紹介は不要

### 本編パート1：概要（約12ターン）
- この研究/ニュースの背景
- 何が起きたのか、何が発見されたのか

### 本編パート2：深掘り（約15ターン）
- なぜこれが重要なのか
- 技術的/学術的な詳細
- 具体例や比喩を交えた分かりやすい説明

### 本編パート3：考察（約15ターン）
- 社会への影響
- 今後の展望
- 批判的な視点や別の見方
- リスナーへの問いかけ

### エンディング（約5ターン）
- まとめ
- ホスト:「詳しい内容は、ひびちどくのWebページに掲載されています。概要欄にリンクを貼っておきますので、ぜひチェックしてみてください」
- ホスト:「チャンネル登録もよろしくお願いします。それでは、また次回お会いしましょう」

## 台本の指示
- 合計50ターンの会話
- 各発言は2-4文、80-150文字程度
- ホストは親しみやすく、質問と相槌が上手
- ゲストは知識を分かりやすく解説（ただし肩書きを名乗らない）
- 「なるほど」「それは興味深いですね」など自然な相槌
- 専門用語は説明を加える

## 出力形式（JSON配列のみ）
[
  {"speaker": "ホスト", "text": "皆さん、こんにちは。ひびちどくの時間です。..."},
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
    speaker: 'ホスト' | 'ゲスト',
    apiKey: string
): Promise<Buffer | null> {
    const voiceId = speaker === 'ホスト' ? VOICES.host : VOICES.guest;
    const settings = speaker === 'ホスト' ? VOICE_SETTINGS.host : VOICE_SETTINGS.guest;

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
                        stability: settings.stability,
                        similarity_boost: settings.similarity_boost,
                        style: settings.style,
                        use_speaker_boost: settings.use_speaker_boost,
                    },
                    // Speed parameter (0.25 to 4.0, default 1.0)
                    speed: settings.speed || 1.0,
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
    console.log('Step 1: Generating 50-turn conversation script...');
    const conversation = await generateConversationScript(article);

    if (conversation.length === 0) {
        console.warn('Failed to generate conversation script');
        return null;
    }

    console.log(`Generated ${conversation.length} turns of conversation`);

    // Calculate estimated length
    const totalChars = conversation.reduce((sum, t) => sum + t.text.length, 0);
    console.log(`Total characters: ${totalChars} (est. ${Math.round(totalChars / 150)} minutes)`);

    // Step 2: Generate audio for each turn
    console.log('Step 2: Generating audio for each turn...');
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < conversation.length; i++) {
        const turn = conversation[i];
        const settings = turn.speaker === 'ホスト' ? VOICE_SETTINGS.host : VOICE_SETTINGS.guest;

        console.log(`  [${i + 1}/${conversation.length}] ${turn.speaker}: ${turn.text.slice(0, 30)}...`);

        let audioBuffer = await generateSpeakerAudio(turn.text, turn.speaker, elevenLabsKey);

        if (audioBuffer) {
            // Apply volume adjustment if needed
            if (settings.volume !== 1.0) {
                try {
                    audioBuffer = await adjustVolume(audioBuffer, settings.volume);
                } catch (e) {
                    console.warn(`  Volume adjustment failed, using original`);
                }
            }
            audioBuffers.push(audioBuffer);
        } else {
            console.warn(`  Failed to generate audio for turn ${i + 1}`);
        }

        // Rate limiting - 150ms between requests
        await new Promise(r => setTimeout(r, 150));
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

    // Step 5: Mix with BGM (if BGM file exists)
    console.log('Step 5: Adding background music...');
    try {
        await mixWithBGM(filepath);
    } catch (error) {
        console.warn('BGM mixing skipped:', error);
    }

    return `/audio/${filename}`;
}
