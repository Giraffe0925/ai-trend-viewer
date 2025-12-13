
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const envPath = path.resolve(process.cwd(), '.env.local');

console.log('--- Debug Info ---');
console.log('CWD:', process.cwd());
console.log('Env Path:', envPath);
console.log('Env File Exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    console.log('Env Content Preview (first 20 chars):', JSON.stringify(content.substring(0, 20)));
}

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Dotenv Error:', result.error);
}

console.log('Parsed Env Keys:', Object.keys(result.parsed || {}));
console.log('process.env.GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

if (process.env.GEMINI_API_KEY) {
    console.log('Testing API connectivity...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    model.generateContent('Say "Hello" in Japanese.')
        .then(res => {
            console.log('API Success! Response:', res.response.text());
        })
        .catch(err => {
            console.error('API Fail:', err);
        });
} else {
    console.error('API Key missing. Cannot test API.');
}
