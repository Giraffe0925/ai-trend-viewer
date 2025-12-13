
import fs from 'fs';
import path from 'path';

const logPath = path.resolve(process.cwd(), 'models_list.json');

try {
    // Try reading as utf-16le first since powershell created it
    let content = fs.readFileSync(logPath, 'utf16le');

    // If it looks like garbage, try utf8
    if (!content.includes('Fetching URL')) {
        content = fs.readFileSync(logPath, 'utf8');
    }

    console.log('--- Extracted Models ---');
    // Simple regex to find "name": "models/..."
    const matches = content.match(/"name":\s*"([^"]+)"/g);
    if (matches) {
        matches.forEach(m => console.log(m));
    } else {
        console.log('No models found in log. Preview:');
        console.log(content.substring(0, 500));
    }

} catch (e) {
    console.error(e);
}
