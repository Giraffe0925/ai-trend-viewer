
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function testModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No API Key found in env');
        return;
    }
    console.log(`Using API Key: ${key.substring(0, 10)}... (Length: ${key.length})`);

    const genAI = new GoogleGenerativeAI(key);

    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.0-pro',
        'models/gemini-1.5-flash',
        'models/gemini-pro'
    ];

    console.log('--- Starting Model Connectivity Test ---');

    for (const modelName of modelsToTest) {
        process.stdout.write(`Testing ${modelName}: `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hello');
            const response = await result.response;
            console.log(`SUCCESS!`);
        } catch (error: any) {
            console.log(`FAILED (${error.message?.substring(0, 50)}...)`);
            // console.log(error); // Uncomment for full details
        }
    }
    console.log('--- Test Complete ---');
}

testModels();
