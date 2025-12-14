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
    bgmVolume: number = 0.2
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
            // Delay podcast audio by 1 second so BGM plays alone first
            .complexFilter([
                // Delay the podcast audio by 1 second (1000ms) for BGM intro
                `[0:a]adelay=1000|1000[voice]`,
                // Adjust BGM volume
                `[1:a]volume=${bgmVolume}[bgm]`,
                // Mix delayed podcast with BGM, using podcast length + 1s as reference
                `[voice][bgm]amix=inputs=2:duration=first:dropout_transition=2[out]`
            ])
            .outputOptions([
                '-map', '[out]',
                '-c:a', 'libmp3lame',
                '-b:a', '192k'
            ])
            .output(finalOutputPath)
            .on('start', (cmd: string) => {
                console.log('  Starting ffmpeg...');
            })
            .on('progress', (progress: { percent?: number }) => {
                if (progress.percent) {
                    process.stdout.write(`\r  Progress: ${Math.round(progress.percent)}%`);
                }
            })
            .on('error', (err: Error) => {
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
        ffmpeg.ffprobe(audioPath, (err: Error | null, metadata: { format: { duration?: number } }) => {
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

/**
 * Adjust volume of an audio buffer using ffmpeg
 * @param audioBuffer - Input audio buffer
 * @param volume - Volume multiplier (1.0 = normal, 1.2 = 20% boost)
 * @returns Adjusted audio buffer
 */
export async function adjustVolume(audioBuffer: Buffer, volume: number): Promise<Buffer> {
    if (volume === 1.0) {
        return audioBuffer; // No adjustment needed
    }

    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputPath = path.join(tempDir, `input_${Date.now()}.mp3`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.mp3`);

    fs.writeFileSync(inputPath, audioBuffer);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioFilters([`volume=${volume}`])
            .output(outputPath)
            .on('end', () => {
                const adjustedBuffer = fs.readFileSync(outputPath);
                // Cleanup temp files
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
                resolve(adjustedBuffer);
            })
            .on('error', (err: Error) => {
                // Cleanup on error
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                reject(err);
            })
            .run();
    });
}

/**
 * Change audio speed using ffmpeg
 * Note: ffmpeg 'atempo' filter is limited to 0.5-2.0. For higher speeds, we need to chain them.
 */
export async function changeSpeed(audioBuffer: Buffer, speed: number): Promise<Buffer> {
    if (speed === 1.0) return audioBuffer;

    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // Use random suffix to avoid collision
    const suffix = Math.random().toString(36).substring(7);
    const inputPath = path.join(tempDir, `input_speed_${Date.now()}_${suffix}.mp3`);
    const outputPath = path.join(tempDir, `output_speed_${Date.now()}_${suffix}.mp3`);

    fs.writeFileSync(inputPath, audioBuffer);

    // Calculate filters
    // e.g. 2.7 -> atempo=2.0,atempo=1.35
    const filters: string[] = [];
    let currentSpeed = speed;

    while (currentSpeed > 2.0) {
        filters.push('atempo=2.0');
        currentSpeed /= 2.0;
    }
    // Avoid precision issues
    if (Math.abs(currentSpeed - 1.0) > 0.01) {
        filters.push(`atempo=${currentSpeed}`);
    }

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioFilters(filters.join(','))
            .output(outputPath)
            .on('end', () => {
                try {
                    const outputBuffer = fs.readFileSync(outputPath);
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                    resolve(outputBuffer);
                } catch (e) {
                    reject(e);
                }
            })
            .on('error', (err: Error) => {
                // cleanup
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                reject(err);
            })
            .run();
    });
}
