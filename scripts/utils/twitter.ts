import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY || '',
    appSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
});

const twitterClient = client.readWrite;

/**
 * Post a tweet about a new article
 */
export async function postToTwitter(
    titleJa: string,
    category: string,
    articleUrl: string
): Promise<boolean> {
    // Check if Twitter credentials are configured
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_ACCESS_TOKEN) {
        console.log('Twitter credentials not configured, skipping post');
        return false;
    }

    try {
        // Create tweet text (280 char limit)
        const categoryEmoji = getCategoryEmoji(category);
        const hashtags = getHashtags(category);

        // Truncate title if needed
        const maxTitleLength = 200;
        const truncatedTitle = titleJa.length > maxTitleLength
            ? titleJa.substring(0, maxTitleLength) + '...'
            : titleJa;

        const tweetText = `${categoryEmoji} ${truncatedTitle}\n\n${hashtags}\n${articleUrl}`;

        await twitterClient.v2.tweet(tweetText);
        console.log(`Posted to Twitter: ${truncatedTitle.substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.error('Failed to post to Twitter:', error);
        return false;
    }
}

function getCategoryEmoji(category: string): string {
    switch (category) {
        case 'AI': return '🤖';
        case '認知科学': return '🧠';
        case '哲学': return '💭';
        case '経済学': return '📈';
        case '社会': return '🌍';
        default: return '📚';
    }
}

function getHashtags(category: string): string {
    switch (category) {
        case 'AI': return '#AI #機械学習 #日々知読';
        case '認知科学': return '#認知科学 #脳科学 #日々知読';
        case '哲学': return '#哲学 #思想 #日々知読';
        case '経済学': return '#経済学 #行動経済学 #日々知読';
        case '社会': return '#社会 #テクノロジー #日々知読';
        default: return '#日々知読';
    }
}
