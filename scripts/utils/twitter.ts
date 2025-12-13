import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY || '',
    appSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
});

const twitterClient = client.readWrite;

/**
 * Post a tweet about a new article with engaging format
 */
export async function postToTwitter(
    titleJa: string,
    category: string,
    articleUrl: string,
    summaryJa?: string
): Promise<boolean> {
    // Check if Twitter credentials are configured
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_ACCESS_TOKEN) {
        console.log('Twitter credentials not configured, skipping post');
        return false;
    }

    try {
        const hook = getEngagingHook(category);
        const categoryEmoji = getCategoryEmoji(category);
        const hashtags = getHashtags(category);

        // Truncate title if needed
        const maxTitleLength = 100;
        const truncatedTitle = titleJa.length > maxTitleLength
            ? titleJa.substring(0, maxTitleLength) + '...'
            : titleJa;

        // Create engaging tweet (280 char limit)
        const tweetText = `${hook}

${categoryEmoji} ${truncatedTitle}

▶ 詳しくは👇
${articleUrl}

${hashtags}`;

        await twitterClient.v2.tweet(tweetText);
        console.log(`Posted to Twitter: ${truncatedTitle.substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.error('Failed to post to Twitter:', error);
        return false;
    }
}

function getEngagingHook(category: string): string {
    const aiHooks = [
        '🔥 最新AI研究が面白すぎる',
        '⚡ これ、知ってた？',
        '🚀 AIの進化が止まらない',
        '💡 未来を変える研究が登場',
        '🧵 最新論文を解説👇',
    ];

    const cognitiveHooks = [
        '🧠 脳科学の新発見',
        '⚡ 人間の知性について驚きの研究',
        '🔬 意識の謎に迫る最新研究',
        '💡 知能の本質とは？',
    ];

    const philosophyHooks = [
        '💭 深い...考えさせられる',
        '🤔 これは面白い視点',
        '📚 哲学的に重要な論考',
        '✨ 知的好奇心が刺激される',
    ];

    const economicsHooks = [
        '📈 経済学の最新知見',
        '💰 行動経済学が明かす真実',
        '🎯 意思決定の科学',
    ];

    const societyHooks = [
        '🌍 社会を変える研究',
        '⚡ テクノロジーと社会の未来',
        '🔮 これからの世界を読み解く',
    ];

    let hooks: string[];
    switch (category) {
        case 'AI': hooks = aiHooks; break;
        case '認知科学': hooks = cognitiveHooks; break;
        case '哲学': hooks = philosophyHooks; break;
        case '経済学': hooks = economicsHooks; break;
        case '社会': hooks = societyHooks; break;
        default: hooks = aiHooks;
    }

    return hooks[Math.floor(Math.random() * hooks.length)];
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
        case 'AI': return '#AI #ChatGPT #AGI';
        case '認知科学': return '#認知科学 #脳科学 #意識';
        case '哲学': return '#哲学 #思想 #知識';
        case '経済学': return '#経済学 #行動経済学';
        case '社会': return '#テクノロジー #未来';
        default: return '#最新研究';
    }
}
