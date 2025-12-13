'use client';

import React from 'react';
import AudioPlayer from '@/components/AudioPlayer';

interface ArticleAudioProps {
    audioUrl: string | undefined;
    title: string;
}

export default function ArticleAudio({ audioUrl, title }: ArticleAudioProps) {
    if (!audioUrl) return null;

    return <AudioPlayer audioUrl={audioUrl} title={title} />;
}
