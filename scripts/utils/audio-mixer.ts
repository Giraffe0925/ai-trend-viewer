/**
 * BGM Audio Mixer using ffmpeg
 * 
 * Mixes background music with podcast audio at a specified volume
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

// Set ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const BGM_FILE = path.join(process.cwd(), 'public', 'audio', 'bgm.mp3');

/**
 * Mix BGM with podcast audio
 * @param podcastPath - Path to the podcast audio file
 * @param outputPath - Path to save the mixed audio (optional, defaults to overwriting input)
 * @param bgmVolume - BGM volume (0.0 to 1.0, default 0.08 = 8%)
 */
export async function mixWithBGM(
    podcastPath: string,
    outputPath?: string,
    bgmVolume: number = 0.08
): Promise<string> {
    // Check if BGM file exists
    if (!fs.existsSync(BGM_FILE)) {
        console.warn('BGM file not found:', BGM_FILE);
        console.warn('Skipping BGM mixing. Please add a BGM file to public/audio/bgm.mp3');
        return podcastPath;
    }

    const finalOutputPath = outputPath || podcastPath.replace('.mp3', '_mixed.mp3');

    return new Promise((resolve, reject) => {
        console.log('Mixing BGM with podcast...');
        console.log('  Podcast:', podcastPath);
        console.log('  BGM volume:', bgmVolume * 100 + '%');

        ffmpeg()
            // Input 1: Podcast audio (main)
            .input(podcastPath)
            // Input 2: BGM (looped to match podcast length)
            .input(BGM_FILE)
            .inputOptions(['-stream_loop', '-1']) // Loop BGM indefinitely
            // Complex filter to mix audio
            .complexFilter([
                // Adjust BGM volume
                `[1:a]volume=${bgmVolume}[bgm]`,
                // Mix podcast with BGM, using podcast length as reference
                `[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[out]`
            ])
            .outputOptions([
                '-map', '[out]',
                '-c:a', 'libmp3lame',
                '-b:a', '192k'
            ])
            .output(finalOutputPath)
            .on('start', (cmd) => {
                console.log('  Starting ffmpeg...');
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    process.stdout.write(`\r  Progress: ${Math.round(progress.percent)}%`);
                }
            })
            .on('error', (err) => {
                console.error('\n  FFmpeg error:', err.message);
                reject(err);
            })
            .on('end', () => {
                console.log('\n  BGM mixing complete!');

                // If outputPath was not specified, replace original file
                if (!outputPath) {
                    fs.unlinkSync(podcastPath);
                    fs.renameSync(finalOutputPath, podcastPath);
                    resolve(podcastPath);
                } else {
                    resolve(finalOutputPath);
                }
            })
            .run();
    });
}

/**
 * Add fade in/out to audio
 */
export async function addFades(
    audioPath: string,
    fadeInSeconds: number = 1,
    fadeOutSeconds: number = 2
): Promise<string> {
    const outputPath = audioPath.replace('.mp3', '_faded.mp3');

    return new Promise((resolve, reject) => {
        console.log('Adding fade in/out...');

        // First, get the duration
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }

            const duration = metadata.format.duration || 0;
            const fadeOutStart = Math.max(0, duration - fadeOutSeconds);

            ffmpeg(audioPath)
                .audioFilters([
                    `afade=t=in:st=0:d=${fadeInSeconds}`,
                    `afade=t=out:st=${fadeOutStart}:d=${fadeOutSeconds}`
                ])
                .output(outputPath)
                .on('end', () => {
                    fs.unlinkSync(audioPath);
                    fs.renameSync(outputPath, audioPath);
                    console.log('  Fade effects added!');
                    resolve(audioPath);
                })
                .on('error', reject)
                .run();
        });
    });
}
