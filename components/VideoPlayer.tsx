"use client";

import React, { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube';
import { Skeleton } from '@/components/ui/skeleton';

interface VideoPlayerProps {
    isLoading: boolean;
    videoUrl?: string; // Expecting a YouTube URL or ID
}

export const VideoPlayer = ({ isLoading, videoUrl }: VideoPlayerProps) => {
    const [videoId, setVideoId] = useState<string | null>(null);
    const playerRef = useRef<YouTubePlayer | null>(null);

    const getYouTubeId = (url: string) => {
        if (!url) return null;
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                return urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                return urlObj.pathname.slice(1);
            }
        } catch {
            return null;
        }
        return null;
    };

    useEffect(() => {
        if (videoUrl) {
            const id = getYouTubeId(videoUrl);
            setVideoId(id);
        }
    }, [videoUrl]);

    const onPlayerReady: YouTubeProps['onReady'] = (event) => {
        playerRef.current = event.target;
        // Autoplay is handled by playerVars, but this is a good fallback.
        event.target.playVideo();
    };

    const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
        // You can add logic here if needed, for example, to track the player state.
        // For simple autoplay and looping, it's not strictly necessary.
    };

    // Unmute the player on the first user interaction (click or keypress)
    useEffect(() => {
        const handleInteraction = () => {
            if (playerRef.current && playerRef.current.isMuted()) {
                playerRef.current.unMute();
                playerRef.current.setVolume(100);
            }
        };

        // The { once: true } option automatically removes the listener after it runs
        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, []);

    // Handle keyboard controls for play/pause and seeking
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!playerRef.current) return;
            switch (e.key) {
                case 'Enter':
                case ' ':
                    const playerState = playerRef.current.getPlayerState();
                    if (playerState === 1) { // Playing
                        playerRef.current.pauseVideo();
                    } else {
                        playerRef.current.playVideo();
                    }
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    const currentTime = playerRef.current.getCurrentTime();
                    playerRef.current.seekTo(currentTime - 10, true);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    const currentTimeRight = playerRef.current.getCurrentTime();
                    playerRef.current.seekTo(currentTimeRight + 10, true);
                    e.preventDefault();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,        // Tell the player to autoplay
            mute: 1,            // Mute is required for autoplay in most browsers
            controls: 0,        // Hide all player controls
            showinfo: 0,        // Hide video title and uploader (deprecated but good to have)
            modestbranding: 1,  // Hide YouTube logo
            rel: 0,             // Do not show related videos
            iv_load_policy: 3,  // Do not show video annotations
            fs: 0,              // Hide fullscreen button
            disablekb: 1,       // Disable player keyboard controls (we handle our own)
            playsinline: 1,
            loop: 1,            // Loop the video
            // The 'playlist' parameter is required for 'loop' to work on a single video
            playlist: videoId || undefined,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
    };

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black">
                <Skeleton className="h-full w-full" />
            </div>
        );
    }

    if (videoId) {
        return (
            // This container uses CSS to hide the top bar of the YouTube player
            <div className="relative w-full h-full overflow-hidden bg-black">
                <YouTube
                    videoId={videoId}
                    opts={opts}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    onEnd={(e) => e.target.playVideo()}
                    className="absolute"
                    style={{
                        width: '100%',
                        // Make the iframe taller than the container
                        height: 'calc(100% + 120px)',
                        // Shift it up to hide the top part
                        top: '-60px',
                    }}
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-black">
            <p className="text-white text-xl">Video not available.</p>
        </div>
    );
};
