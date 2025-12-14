'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
    audioUrl: string;
    title: string;
}

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2, 2.5];
const BGM_URL = '/audio/bgm-lofi.mp3'; // BGMファイルをpublic/audio/に配置

export default function AudioPlayer({ audioUrl, title }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.5);
    const [bgmEnabled, setBgmEnabled] = useState(true); // BGM always on by default
    const [bgmVolume, setBgmVolume] = useState(0.1); // BGM音量 10%
    const audioRef = useRef<HTMLAudioElement>(null);
    const bgmRef = useRef<HTMLAudioElement>(null);

    // BGM制御
    useEffect(() => {
        if (bgmRef.current) {
            bgmRef.current.volume = bgmVolume;
            bgmRef.current.loop = true;

            if (bgmEnabled && isPlaying) {
                bgmRef.current.play().catch(() => { });
            } else {
                bgmRef.current.pause();
            }
        }
    }, [bgmEnabled, isPlaying, bgmVolume]);

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
            audioRef.current.playbackRate = playbackSpeed;
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };

    const handleSpeedChange = (speed: number) => {
        setPlaybackSpeed(speed);
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        if (bgmRef.current) {
            bgmRef.current.pause();
        }
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
            <audio
                ref={bgmRef}
                src={BGM_URL}
                loop
                preload="none"
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

                {/* Speed Control */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                }}>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>速度</span>
                    <select
                        value={playbackSpeed}
                        onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                        style={{
                            backgroundColor: '#374151',
                            color: '#e5e7eb',
                            border: '1px solid #4b5563',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            outline: 'none',
                        }}
                    >
                        {PLAYBACK_SPEEDS.map((speed) => (
                            <option key={speed} value={speed}>
                                {speed}x
                            </option>
                        ))}
                    </select>
                </div>

                {/* BGM Toggle */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                }}>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>BGM</span>
                    <button
                        onClick={() => setBgmEnabled(!bgmEnabled)}
                        style={{
                            backgroundColor: bgmEnabled ? '#6366f1' : '#374151',
                            color: '#e5e7eb',
                            border: '1px solid #4b5563',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'background-color 0.2s',
                        }}
                    >
                        {bgmEnabled ? '♪ ON' : '♪ OFF'}
                    </button>
                </div>
            </div>
        </div>
    );
}
