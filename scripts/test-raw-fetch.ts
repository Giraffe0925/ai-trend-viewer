
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function testRawFetch() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No API Key');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log('Fetching URL:', url.replace(key, 'HIDDEN_KEY'));

    try {
        const res = await fetch(url);
        console.log('Status:', res.status, res.statusText);
        if (res.ok) {
            const data = await res.json();
            console.log('Data (first 2 models):', JSON.stringify(data.models?.slice(0, 2), null, 2));
        } else {
            const text = await res.text();
            console.log('Error Body:', text);
        }
    } catch (error: any) {
        console.error('Fetch Error:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testRawFetch();
