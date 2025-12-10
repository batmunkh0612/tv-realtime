"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube';
import { Skeleton } from '@/components/ui/skeleton';

const getYouTubeId = (url: string) => {
    if (!url) {
        console.log('⚠️ getYouTubeId: Empty URL');
        return null;
    }
    
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        console.log('✅ getYouTubeId: Direct ID format:', url);
        return url;
    }
    
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            const videoId = urlObj.searchParams.get('v');
            console.log('✅ getYouTubeId: Extracted from youtube.com:', videoId, 'from', url);
            return videoId;
        } else if (urlObj.hostname.includes('youtu.be')) {
            const videoId = urlObj.pathname.slice(1);
            console.log('✅ getYouTubeId: Extracted from youtu.be:', videoId, 'from', url);
            return videoId;
        }
    } catch (error) {
        console.log('❌ getYouTubeId: Failed to parse URL:', url, error);
        return null;
    }
    
    console.log('⚠️ getYouTubeId: Unknown format:', url);
    return null;
};

interface VideoPlayerProps {
    isLoading: boolean;
    videoUrl?: string;
    queue?: string[];
}

export const VideoPlayer = ({ isLoading, videoUrl, queue = [] }: VideoPlayerProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const playerRef = useRef<YouTubePlayer | null>(null);

    const playlist = useMemo(() => {
        let rawQueue: string[] = [];
        if (queue && queue.length > 0) {
            rawQueue = queue;
        } else if (videoUrl) {
            rawQueue = [videoUrl];
        }

        const result = rawQueue
            .map(url => getYouTubeId(url))
            .filter((id): id is string => !!id);
        
        console.log('🔄 VideoPlayer: Playlist computed:', result);
        return result;
    }, [queue, videoUrl]);

    const validIndex = useMemo(() => {
        if (playlist.length === 0) return 0;
        return currentIndex >= playlist.length ? 0 : currentIndex;
    }, [playlist.length, currentIndex]);

    const currentVideoId = useMemo(() => {
        if (playlist.length === 0) return null;
        const videoId = playlist[validIndex] || null;
        console.log('🎬 VideoPlayer: Current video ID updated to:', videoId);
        console.log('   Playlist:', playlist);
        console.log('   Valid index:', validIndex);
        return videoId;
    }, [playlist, validIndex]);

    const onPlayerReady: YouTubeProps['onReady'] = (event) => {
        console.log('🎮 YouTube Player Ready - Video ID:', currentVideoId);
        playerRef.current = event.target;
        
        try {
            const availableQualities = event.target.getAvailableQualityLevels();
            console.log('Available qualities:', availableQualities);
            
            if (availableQualities.length > 0) {
                event.target.setPlaybackQuality(availableQualities[0]);
                console.log('✅ Set quality to:', availableQualities[0]);
            }
        } catch (error) {
            console.log('Could not set quality:', error);
        }
        
        try {
            event.target.unMute();
            event.target.setVolume(100);
            
            setTimeout(() => {
                if (event.target && !event.target.isMuted()) {
                    setHasUserInteracted(true);
                    console.log('✅ Audio auto-enabled successfully');
                } else {
                    console.log('⚠️ Auto-unmute blocked by browser, waiting for user interaction');
                }
            }, 500);
        } catch (error) {
            console.log('Auto-unmute blocked, waiting for user interaction', error);
        }
        
        console.log('▶️ Starting playback');
        event.target.playVideo();
    };

    const handleVideoEnd = useCallback(() => {
        if (playlist.length === 0) return;

        setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    }, [playlist.length]);

    const onPlayerStateChange: YouTubeProps['onStateChange'] = () => {
    };

    useEffect(() => {
        const handleInteraction = () => {
            setHasUserInteracted(true);
            if (playerRef.current) {
                playerRef.current.unMute();
                playerRef.current.setVolume(100);
                const playerState = playerRef.current.getPlayerState();
                if (playerState !== 1) {
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

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            console.log('🎮 VideoPlayer Key event:', {
                key: e.key,
                code: e.code,
                keyCode: e.keyCode,
                which: e.which
            });
            
            if (!playerRef.current) {
                console.log('⚠️ Player not ready');
                return;
            }
            
            if (!hasUserInteracted) {
                console.log('🔊 First interaction - attempting to unmute');
                if (playerRef.current.isMuted()) {
                    playerRef.current.unMute();
                    playerRef.current.setVolume(100);
                }
                setHasUserInteracted(true);
            }
            
            const key = e.key;
            const keyCode = e.keyCode;
            
            if (
                key === 'Enter' || 
                key === ' ' || 
                key === 'MediaPlayPause' || 
                key === 'Play' || 
                key === 'Pause' ||
                keyCode === 13 ||
                keyCode === 32 ||
                keyCode === 415 ||
                keyCode === 19 ||
                keyCode === 10252
            ) {
                console.log('▶️ Play/Pause triggered');
                const playerState = playerRef.current.getPlayerState();
                if (playerState === 1) playerRef.current.pauseVideo();
                else playerRef.current.playVideo();
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            if (
                key === 'ArrowLeft' || 
                key === 'MediaRewind' || 
                key === 'Rewind' ||
                keyCode === 37 ||
                keyCode === 412
            ) {
                console.log('⏪ Rewind/Left triggered');
                playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10, true);
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            if (
                key === 'ArrowRight' || 
                key === 'MediaFastForward' || 
                key === 'FastForward' ||
                keyCode === 39 ||
                keyCode === 417
            ) {
                console.log('⏩ FastForward/Right triggered');
                playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, true);
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            if (
                key === 'n' || 
                key === 'N' ||
                key === 'MediaTrackNext' || 
                key === 'NextTrack' ||
                keyCode === 78 ||
                keyCode === 176
            ) {
                console.log('⏭️ Next video triggered');
                handleVideoEnd();
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            if (key === 'ArrowUp' || keyCode === 38) {
                console.log('⬆️ Up arrow - passing through for menu');
                return;
            }
            
            if (key === 'ArrowDown' || keyCode === 40) {
                console.log('⬇️ Down arrow - passing through for menu');
                return;
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
            loop: 0,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
            vq: 'hd1080',
            hd: 1,
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
        console.log('🎯 VideoPlayer: Rendering with video ID:', currentVideoId);
        return (
            <div className="relative w-full h-full overflow-hidden bg-black">
                <YouTube
                    key={currentVideoId}
                    videoId={currentVideoId}
                    opts={opts}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    onEnd={handleVideoEnd}
                    className="absolute"
                    style={{
                        width: '100%',
                        height: 'calc(100% + 120px)',
                        top: '-60px',
                    }}
                />
                <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded text-xs font-mono">
                    Playing: {currentVideoId}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-black">
            <p className="text-white text-xl">No videos in queue.</p>
        </div>
    );
};
