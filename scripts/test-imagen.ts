
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testImagen() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No key');
        return;
    }

    // Raw REST API approach for Imagen 3 (since SDK support varies)
    // Endpoint: https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict
    const modelName = 'models/imagen-3.0-generate-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:predict?key=${key}`;

    const prompt = "A futuristic city with flying cars, soft pastel colors, minimalist 3D render style.";

    const body = {
        instances: [
            { prompt: prompt }
        ],
        parameters: {
            sampleCount: 1,
            aspectRatio: "16:9" // or "1:1"
        }
    };

    try {
        console.log('Fetching', url);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            console.error('Error:', res.status, await res.text());
            return;
        }

        const data = await res.json();
        // Response structure usually: { predictions: [ { bytesBase64Encoded: "..." } ] }

        if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
            const buffer = Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
            fs.writeFileSync('public/images/test-imagen.png', buffer);
            console.log('Saved public/images/test-imagen.png');
        } else {
            console.log('Unexpected structure:', JSON.stringify(data).substring(0, 200));
        }

    } catch (e) {
        console.error(e);
    }
}

testImagen();
