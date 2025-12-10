"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube';
import { Skeleton } from '@/components/ui/skeleton';

// Helper to extract ID from various YouTube URL formats
const getYouTubeId = (url: string) => {
    if (!url) return null;
    // Handle standard database loops where we might just have the ID
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

interface VideoPlayerProps {
    isLoading: boolean;
    videoUrl?: string; // Legacy support
    queue?: string[]; // New queue support
}

export const VideoPlayer = ({ isLoading, videoUrl, queue = [] }: VideoPlayerProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const playerRef = useRef<YouTubePlayer | null>(null);

    // Compute playlist from queue or videoUrl (derived state)
    const playlist = useMemo(() => {
        let rawQueue: string[] = [];
        if (queue && queue.length > 0) {
            rawQueue = queue;
        } else if (videoUrl) {
            rawQueue = [videoUrl];
        }

        return rawQueue
            .map(url => getYouTubeId(url))
            .filter((id): id is string => !!id);
    }, [queue, videoUrl]);

    // Compute current video ID from playlist and index (derived state)
    // Clamp index to valid range
    const validIndex = useMemo(() => {
        if (playlist.length === 0) return 0;
        return currentIndex >= playlist.length ? 0 : currentIndex;
    }, [playlist.length, currentIndex]);

    const currentVideoId = useMemo(() => {
        if (playlist.length === 0) return null;
        return playlist[validIndex] || null;
    }, [playlist, validIndex]);

    const onPlayerReady: YouTubeProps['onReady'] = (event) => {
        playerRef.current = event.target;
        event.target.playVideo();
        
        // If user has already interacted, unmute immediately for subsequent videos
        if (hasUserInteracted) {
            event.target.unMute();
            event.target.setVolume(100);
        }
    };

    const handleVideoEnd = useCallback(() => {
        if (playlist.length === 0) return;

        // Move to next index (currentVideoId will update automatically via useMemo)
        setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    }, [playlist.length]);

    const onPlayerStateChange: YouTubeProps['onStateChange'] = () => {
        // Optional: handle buffering etc
    };

    // Unmute logic - track user interaction for subsequent videos
    useEffect(() => {
        const handleInteraction = () => {
            setHasUserInteracted(true);
            if (playerRef.current) {
                // Force unmute regardless of muted state
                playerRef.current.unMute();
                playerRef.current.setVolume(100);
                // Ensure playback continues
                const playerState = playerRef.current.getPlayerState();
                if (playerState !== 1) { // Not playing
                    playerRef.current.playVideo();
                }
            }
        };
        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, []);

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!playerRef.current) return;
            
            // Ensure unmute on any keyboard interaction
            if (!hasUserInteracted && playerRef.current.isMuted()) {
                setHasUserInteracted(true);
                playerRef.current.unMute();
                playerRef.current.setVolume(100);
            }
            
            switch (e.key) {
                case 'Enter':
                case ' ':
                    const playerState = playerRef.current.getPlayerState();
                    if (playerState === 1) playerRef.current.pauseVideo();
                    else playerRef.current.playVideo();
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10, true);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, true);
                    e.preventDefault();
                    break;
                // Add Next/Prev track controls? 
                case 'n': // Next
                    handleVideoEnd();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleVideoEnd, hasUserInteracted]);

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            fs: 0,
            disablekb: 1,
            playsinline: 1,
            // distinct from loop=1 because that loops the single video. 
            // We want to handle looping manually by changing the video ID.
            loop: 0,
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

    if (currentVideoId) {
        return (
            <div className="relative w-full h-full overflow-hidden bg-black">
                <YouTube
                    key={currentVideoId} // Key is crucial to force re-render/reload explicitly when video changes
                    videoId={currentVideoId}
                    opts={opts}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    onEnd={handleVideoEnd} // Trigger next video
                    className="absolute"
                    style={{
                        width: '100%',
                        height: 'calc(100% + 120px)',
                        top: '-60px',
                    }}
                />
                
                {/* Audio Enable Prompt - Shows until user interacts */}
                {!hasUserInteracted && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                        <div className="bg-black/80 backdrop-blur-sm text-white px-8 py-6 rounded-2xl border-2 border-white/30 shadow-2xl animate-pulse">
                            <div className="text-center">
                                <div className="text-4xl mb-3">🔇</div>
                                <div className="text-xl font-bold mb-2">Click or Press Any Key</div>
                                <div className="text-sm text-white/80">to Enable Audio</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-black">
            <p className="text-white text-xl">No videos in queue.</p>
        </div>
    );
};
