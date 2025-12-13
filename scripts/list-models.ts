
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function listModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('No API Key');
        return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There is no direct "listModels" on the instance in some SDK versions, but let's try the ModelService or just try a standard model
    // Actually the JS SDK doesn't expose listModels easily in the main entry?
    // It does: genAI.getGenerativeModel is the main way.

    // Let's try to infer from error or just try 'gemini-1.5-flash' again ensuring exact string.

    console.log('Trying gemini-1.5-flash...');
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const res = await model.generateContent('Hi');
        console.log('gemini-1.5-flash WORKED.');
        return;
    } catch (e: any) {
        console.log('gemini-1.5-flash FAILED:', e.message);
    }

    console.log('Trying gemini-pro...');
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const res = await model.generateContent('Hi');
        console.log('gemini-pro WORKED.');
        return;
    } catch (e: any) {
        console.log('gemini-pro FAILED:', e.message);
    }
}

listModels();
