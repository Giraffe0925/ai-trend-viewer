'use client';

import React, { useState, useRef } from 'react';

interface AudioPlayerProps {
    audioUrl: string;
    title: string;
}

export default function AudioPlayer({ audioUrl, title }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '32px',
        }}>
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
            }}>
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <span style={{ fontSize: '20px', color: 'white' }}>
                        {isPlaying ? '⏸' : '▶'}
                    </span>
                </button>

                {/* Info & Progress */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: '14px',
                        color: '#9ca3af',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <span style={{ fontSize: '16px' }}>🎙️</span>
                        <span>ポッドキャスト</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <span style={{ fontSize: '12px', color: '#9ca3af', width: '40px' }}>
                            {formatTime(progress)}
                        </span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={progress}
                            onChange={handleSeek}
                            style={{
                                flex: 1,
                                height: '4px',
                                cursor: 'pointer',
                                accentColor: '#6366f1',
                            }}
                        />
                        <span style={{ fontSize: '12px', color: '#9ca3af', width: '40px' }}>
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
