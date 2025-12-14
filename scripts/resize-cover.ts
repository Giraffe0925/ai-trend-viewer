import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

// Set ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
} else {
    console.error('ffmpeg-static path not found');
    process.exit(1);
}

const inputPath = path.join(process.cwd(), 'public', 'images', 'podcast-cover.jpg');
const tempPath = path.join(process.cwd(), 'public', 'images', 'podcast-cover-resized.jpg');

console.log('Resizing image:', inputPath);

ffmpeg(inputPath)
    .outputOptions([
        '-vf', 'scale=1400:1400'
    ])
    .output(tempPath)
    .on('end', () => {
        console.log('Image resized successfully!');
        // Replace original
        fs.unlinkSync(inputPath);
        fs.renameSync(tempPath, inputPath);
        console.log('Original image replaced.');
    })
    .on('error', (err: Error) => {
        console.error('Error resizing image:', err);
        process.exit(1);
    })
    .run();
