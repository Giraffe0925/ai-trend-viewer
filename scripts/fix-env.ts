
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');

try {
    if (fs.existsSync(envPath)) {
        // Read with generic encoding (node usually handles BOM if utf8, but let's try reading as buffer)
        const buffer = fs.readFileSync(envPath);
        // Convert to string assuming it might be utf16le? Or just toString() might work if it detects BOM.
        // If it was created by PowerShell '>', it's likely UTF-16LE with BOM.

        let content = buffer.toString('utf8');

        // Check for null bytes which indicate utf16le interpreted as utf8
        if (content.includes('\u0000')) {
            console.log('Detected UTF-16LE (null bytes). Converting...');
            content = buffer.toString('utf16le');
        }

        // Clean up
        content = content.trim();

        // Write back as UTF-8
        fs.writeFileSync(envPath, content, 'utf8');
        console.log('Fixed .env.local encoding to UTF-8.');
        console.log('Content preview:', content.substring(0, 20) + '...');
    } else {
        console.log('.env.local not found.');
    }
} catch (e) {
    console.error('Error fixing env:', e);
}
