import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Article {
    id: string;
    title: string;
    titleJa?: string;
    summary: string;
    summaryJa?: string;
    url: string;
    publishedAt: string;
    audioUrl?: string;
    category?: string;
}

interface PodcastConfig {
    title: string;
    description: string;
    author: string;
    email: string;
    language: string;
    category: string;
    subcategory: string;
    explicit: boolean;
    image: string;
    website: string;
}

export async function GET(request: Request) {
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Load podcast config
    const configPath = path.join(process.cwd(), 'data', 'podcast-config.json');
    const config: PodcastConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Load articles with audio
    const postsPath = path.join(process.cwd(), 'data', 'posts.json');
    const articles: Article[] = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
    const podcastEpisodes = articles.filter(a => a.audioUrl);

    // Sort by date (newest first)
    podcastEpisodes.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Generate RSS XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
    xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>${escapeXml(config.title)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(config.description)}</description>
    <language>${config.language}</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(config.author)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/podcast/feed.xml" rel="self" type="application/rss+xml"/>
    
    <!-- iTunes/Spotify specific tags -->
    <itunes:author>${escapeXml(config.author)}</itunes:author>
    <itunes:summary>${escapeXml(config.description)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:owner>
        <itunes:name>${escapeXml(config.author)}</itunes:name>
        <itunes:email>${config.email}</itunes:email>
    </itunes:owner>
    <itunes:explicit>${config.explicit ? 'true' : 'false'}</itunes:explicit>
    <itunes:category text="${config.category}">
        <itunes:category text="${config.subcategory}"/>
    </itunes:category>
    <itunes:image href="${baseUrl}${config.image}"/>
    <image>
        <url>${baseUrl}${config.image}</url>
        <title>${escapeXml(config.title)}</title>
        <link>${baseUrl}</link>
    </image>

    ${podcastEpisodes.map((episode, index) => {
        const title = episode.titleJa || episode.title;
        const description = episode.summaryJa || episode.summary;
        const audioUrl = `${baseUrl}${episode.audioUrl}`;
        const pubDate = new Date(episode.publishedAt).toUTCString();
        const episodeNumber = podcastEpisodes.length - index;
        const guid = Buffer.from(episode.id).toString('base64url');

        // Calculate file size
        let fileSize = 10000000; // Default fallback
        try {
            if (episode.audioUrl) {
                const filePath = path.join(process.cwd(), 'public', episode.audioUrl);
                if (fs.existsSync(filePath)) {
                    fileSize = fs.statSync(filePath).size;
                }
            }
        } catch (e) {
            console.error('Error getting file size:', e);
        }

        return `
    <item>
        <title>${escapeXml(title)}</title>
        <description><![CDATA[${description}]]></description>
        <link>${baseUrl}/articles/${guid}</link>
        <guid isPermaLink="false">${guid}</guid>
        <pubDate>${pubDate}</pubDate>
        <enclosure url="${audioUrl}" type="audio/mpeg" length="${fileSize}"/>
        <itunes:title>${escapeXml(title)}</itunes:title>
        <itunes:summary>${escapeXml(description.slice(0, 255))}</itunes:summary>
        <itunes:episode>${episodeNumber}</itunes:episode>
        <itunes:duration>10:00</itunes:duration>
        <itunes:explicit>false</itunes:explicit>
    </item>`;
    }).join('')}

</channel>
</rss>`;

    return new NextResponse(rss, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
    });
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
