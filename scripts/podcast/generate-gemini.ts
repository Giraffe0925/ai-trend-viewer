/**
 * Gemini Multi-Speaker Podcast Generator
 * 
 * 10-15 minute podcasts using Gemini 2.5 Flash TTS
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Article } from '../../src/types';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Set ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

// Audio post-processing settings
const AUDIO_SETTINGS = {
    speed: 1.25,       // Host speed: 1.25x
    volume: 1.2,       // Overall volume: +20%
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

## 番組コンセプト
        - 「休日の朝にカフェで聴く、テック系ラジオ」
        - 堅苦しい解説ではなく、二人のパーソナリティが楽しくおしゃべりしながらニュースを掘り下げるスタイル。

        ## 構成指示 (全体で50ターン程度)
        1. **オープニング (重要)**
           - ホスト: 明るく元気よく！「みなさん、こんにちは！ひびちどくラジオへようこそ！」
           - フリートーク: 「最近寒くなってきましたね〜」のような季節の話題や、「昨日のAppleの発表見ました？」のような軽い雑談から入り、スムーズに本題へ繋げる。
        
        2. **本題 (メインパート)**
           - 記事の内容をベースにするが、読み上げるのではなく「会話」にする。
           - 「えっ、それって本当？」「マジで！？」というような、大きめのリアクションを入れる。
           - 専門的な話ボケとツッコミのような関係性で、分かりやすく噛み砕く。
           - ホストが熱く語り、ゲストが冷静に突っ込む、あるいはその逆など、キャラを立てる。

        3. **エンディング**
           - 「いや〜、今日の話も深かったですね」と感想を言い合う。
           - ホスト:「詳しい内容は、ひびちどくのWebページに掲載されています。概要欄のリンクから飛んでみてくださいね！」
           - 最後は二人で声を合わせて「それでは、また次回！バイバーイ！」と元気に締める。

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
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        const text = result.response.text();
        console.log('--- Gemini Script Response Start ---');
        console.log(text);
        console.log('--- Gemini Script Response End ---');

        const conversation = JSON.parse(text) as ConversationTurn[];
        console.log(`Parsed ${conversation.length} conversation turns.`);
        return conversation;
    } catch (error) {
        console.error('Failed to generate conversation script:', error);
        return [];
    }
}

/**
 * Convert conversation to text format for multi-speaker TTS
 */
function formatConversationForTTS(conversation: ConversationTurn[]): string {
    return conversation.map(turn => `${turn.speaker}: ${turn.text}`).join('\n\n');
}

/**
 * Post-process audio: adjust speed and volume using ffmpeg
 */
async function postProcessAudio(inputPath: string, speed: number, volume: number): Promise<string> {
    const outputPath = inputPath.replace('.wav', '_processed.mp3');

    console.log(`  Post-processing: speed=${speed}x, volume=${volume}x`);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioFilters([
                `atempo=${speed}`,
                `volume=${volume}`
            ])
            .outputOptions([
                '-c:a', 'libmp3lame',
                '-b:a', '192k'
            ])
            .output(outputPath)
            .on('end', () => {
                // Delete original WAV file
                fs.unlinkSync(inputPath);
                // Rename processed file to have simpler name
                const finalPath = inputPath.replace('.wav', '.mp3');
                fs.renameSync(outputPath, finalPath);
                console.log(`  Post-processing complete!`);
                resolve(finalPath);
            })
            .on('error', (err: Error) => {
                console.error('  Post-processing error:', err.message);
                reject(err);
            })
            .run();
    });
}

/**
 * Generate audio using Gemini TTS with multi-speaker support
 */
async function generateAudioWithGeminiTTS(
    conversation: ConversationTurn[],
    apiKey: string
): Promise<Buffer | null> {
    // Format conversation for multi-speaker TTS
    const ttsPrompt = formatConversationForTTS(conversation);

    console.log('Calling Gemini TTS API...');

    try {
        // Use REST API directly for TTS (SDK may not support audio output yet)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: ttsPrompt }]
                    }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            languageCode: 'ja-JP',
                            multiSpeakerVoiceConfig: {
                                speakerVoiceConfigs: [
                                    {
                                        speaker: 'ホスト',
                                        voiceConfig: {
                                            prebuiltVoiceConfig: {
                                                voiceName: 'Aoede'  // Female voice
                                            }
                                        }
                                    },
                                    {
                                        speaker: 'ゲスト',
                                        voiceConfig: {
                                            prebuiltVoiceConfig: {
                                                voiceName: 'Charon'  // Male voice
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini TTS API error:', response.status, errorText);
            return null;
        }

        const result = await response.json();

        // Extract audio data from response
        if (result.candidates &&
            result.candidates[0]?.content?.parts?.[0]?.inlineData?.data) {
            const audioBase64 = result.candidates[0].content.parts[0].inlineData.data;
            const audioBuffer = Buffer.from(audioBase64, 'base64');
            console.log(`Generated audio: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);
            return audioBuffer;
        } else {
            console.error('Unexpected API response structure:', JSON.stringify(result, null, 2));
            return null;
        }
    } catch (error) {
        console.error('Failed to generate audio with Gemini TTS:', error);
        return null;
    }
}

/**
 * Main function to generate podcast from article
 */
export async function generatePodcastAudio(article: Article): Promise<string | null> {
    const geminiKey = process.env.GEMINI_API_KEY || '';
    if (!geminiKey) {
        console.warn('GEMINI_API_KEY not found');
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

    // Step 2: Generate audio using Gemini TTS
    console.log('Step 2: Generating audio with Gemini TTS...');
    const audioBuffer = await generateAudioWithGeminiTTS(conversation, geminiKey);

    if (!audioBuffer) {
        console.error('Failed to generate audio');
        return null;
    }

    // Step 3: Save as WAV file (temporary)
    const timestamp = Date.now();
    const tempFilename = `podcast_${Buffer.from(article.id).toString('base64url')}_${timestamp}.wav`;
    const tempFilepath = path.join(AUDIO_DIR, tempFilename);

    fs.writeFileSync(tempFilepath, audioBuffer);
    console.log(`Saved temp WAV: ${tempFilename} (${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Step 4: Post-process audio (speed + volume)
    console.log('Step 3: Post-processing audio (speed + volume)...');
    try {
        const finalPath = await postProcessAudio(
            tempFilepath,
            AUDIO_SETTINGS.speed,
            AUDIO_SETTINGS.volume
        );

        const filename = path.basename(finalPath);
        const stats = fs.statSync(finalPath);
        console.log(`Podcast saved: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

        return `/audio/${filename}`;
    } catch (error) {
        console.error('Post-processing failed:', error);
        // Fallback: return the WAV file if processing fails
        return `/audio/${tempFilename}`;
    }
}
