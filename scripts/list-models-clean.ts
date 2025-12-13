
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function listModelsClean() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return;

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            const names = data.models?.map((m: any) => m.name) || [];
            fs.writeFileSync('models.txt', names.join('\n'), 'utf8');
            console.log('Saved models to models.txt');
        } else {
            console.error('Fetch failed:', res.status);
        }
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

listModelsClean();
