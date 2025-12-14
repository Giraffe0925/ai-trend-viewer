/**
 * Gemini Multi-Speaker Podcast Generator
 * 
 * This script generates discussion-style podcast audio from articles using:
 * 1. Gemini LLM to generate a conversation script
 * 2. Gemini TTS Multi-Speaker to convert to audio
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Article } from '../types';
import fs from 'fs';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

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
    const commentary = article.translationJa || '';

    const prompt = `
あなたはラジオ番組の脚本家です。以下の記事内容をもとに、2人のパーソナリティ（ホストとゲスト）が議論する形式の台本を作成してください。

## 記事タイトル
${title}

## 記事概要
${overview}

## 論評
${commentary}

## 指示
- ホストとゲストが交互に話す自然な会話形式で
- 合計6-8ターンの短いやりとり（全体で60-90秒程度の長さ）
- ホストは聞き手として質問や相槌を入れる
- ゲストは專門家として解説する
- 最後は「ご視聴ありがとうございました」で締める
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

        // Extract JSON from response
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
 * Generate multi-speaker audio using Gemini TTS
 */
async function generateMultiSpeakerAudio(
    conversation: ConversationTurn[],
    articleId: string
): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
        console.warn('GEMINI_API_KEY not found');
        return null;
    }

    // Ensure audio directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    // Build the conversation text with speaker labels
    const conversationText = conversation
        .map(turn => `${turn.speaker}: ${turn.text}`)
        .join('\n\n');

    console.log('Generating audio for conversation...');
    console.log('Script preview:', conversationText.substring(0, 200) + '...');

    try {
        // Use Gemini API for TTS (using the REST API directly)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-tts:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: conversationText
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            multiSpeakerVoiceConfig: {
                                speakerVoiceConfigs: [
                                    {
                                        speaker: 'ホスト',
                                        voiceConfig: {
                                            prebuiltVoiceConfig: {
                                                voiceName: 'Kore'  // Female Japanese voice
                                            }
                                        }
                                    },
                                    {
                                        speaker: 'ゲスト',
                                        voiceConfig: {
                                            prebuiltVoiceConfig: {
                                                voiceName: 'Sadaltager'  // Male Japanese voice
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
            const error = await response.text();
            console.error('Gemini TTS API error:', error);
            return null;
        }

        const data = await response.json();

        // Extract audio data from response
        const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!audioData) {
            console.error('No audio data in response');
            console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
            return null;
        }

        // Save as MP3 file
        const filename = `podcast_${Buffer.from(articleId).toString('base64url')}.mp3`;
        const filepath = path.join(AUDIO_DIR, filename);

        fs.writeFileSync(filepath, Buffer.from(audioData, 'base64'));
        console.log(`Podcast generated: ${filename}`);

        return `/audio/${filename}`;
    } catch (error) {
        console.error('Failed to generate audio:', error);
        return null;
    }
}

/**
 * Main function to generate podcast from article
 */
export async function generatePodcastAudio(article: Article): Promise<string | null> {
    console.log('Generating discussion-style podcast for:', article.titleJa || article.title);

    // Step 1: Generate conversation script
    const conversation = await generateConversationScript(article);

    if (conversation.length === 0) {
        console.warn('Failed to generate conversation script');
        return null;
    }

    console.log(`Generated ${conversation.length} turns of conversation`);

    // Step 2: Generate multi-speaker audio
    const audioUrl = await generateMultiSpeakerAudio(conversation, article.id);

    return audioUrl;
}
