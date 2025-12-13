
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'posts.json');
const content = fs.readFileSync(filePath, 'utf-8');
const articles = JSON.parse(content);

if (articles.length > 0) {
    const id = articles[0].id;
    const encoded = Buffer.from(id).toString('base64');
    console.log(`URL: http://localhost:3000/articles/${encoded}`);
} else {
    console.log('No articles found');
}
