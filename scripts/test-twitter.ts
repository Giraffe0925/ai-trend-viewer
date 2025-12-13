import { TwitterApi } from 'twitter-api-v2';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testTweet() {
    console.log('Testing Twitter connection...');
    console.log('API Key:', process.env.TWITTER_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('API Secret:', process.env.TWITTER_API_SECRET ? '✅ Set' : '❌ Missing');
    console.log('Access Token:', process.env.TWITTER_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('Access Secret:', process.env.TWITTER_ACCESS_SECRET ? '✅ Set' : '❌ Missing');

    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_ACCESS_TOKEN) {
        console.log('Twitter credentials not found!');
        return;
    }

    const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });

    try {
        const twitterClient = client.readWrite;

        const testTweet = `📚 日々知読 テスト投稿

科学・哲学・テクノロジーの最先端研究を日本語でお届けします。

#日々知読 #テスト
https://ai-trend-viewer.vercel.app`;

        const result = await twitterClient.v2.tweet(testTweet);
        console.log('✅ Tweet posted successfully!');
        console.log('Tweet ID:', result.data.id);
    } catch (error: any) {
        console.error('❌ Failed to post tweet:', error.message || error);
        if (error.data) {
            console.error('Error details:', JSON.stringify(error.data, null, 2));
        }
    }
}

testTweet();
