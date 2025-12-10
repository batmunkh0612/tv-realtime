"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref as dbRef, get } from 'firebase/database';
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

interface UserData {
  name?: string;
  videoUrl?: string;
  queue?: string[];
  message?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');
  const [userId, setUserId] = useState<string>('user1');
  const [message, setMessage] = useState<string>('');
  const [queue, setQueue] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load available users from Firebase
  useEffect(() => {
    const usersRef = dbRef(database, 'users');

    get(usersRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const users = Object.keys(snapshot.val());
          setAvailableUsers(users);
        }
        setIsLoadingUsers(false);
      })
      .catch((error) => {
        console.error('Error loading users:', error);
        setError('Failed to load users. Please check your Firebase connection.');
        setIsLoadingUsers(false);
      });
  }, []);

  // Load user data (queue and message) when userId changes
  useEffect(() => {
    if (!userId) return;

    setIsLoadingUserData(true);
    const userRef = dbRef(database, `users/${userId}`);

    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userData: UserData = snapshot.val();
          // Load queue if it exists, otherwise fall back to videoUrl as single-item queue
          if (userData.queue && userData.queue.length > 0) {
            setQueue(userData.queue);
          } else if (userData.videoUrl) {
            setQueue([userData.videoUrl]);
          } else {
            setQueue([]);
          }
          setMessage(userData.message || '');
        } else {
          setQueue([]);
          setMessage('');
        }
        setIsLoadingUserData(false);
      })
      .catch((error) => {
        console.error('Error loading user data:', error);
        setError('Failed to load user data.');
        setIsLoadingUserData(false);
      });
  }, [userId]);

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) {
      setError('Please enter a YouTube URL.');
      return;
    }

    // Validate YouTube URL
    const videoId = getYouTubeId(newVideoUrl);
    if (!videoId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube URL.');
      return;
    }

    setError(null);
    setQueue([...queue, newVideoUrl.trim()]);
    setNewVideoUrl('');
  };

  const handleRemoveVideo = (index: number) => {
    setQueue(queue.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newQueue = [...queue];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    setQueue(newQueue);
  };

  const handleMoveDown = (index: number) => {
    if (index === queue.length - 1) return;
    const newQueue = [...queue];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    setQueue(newQueue);
  };

  const handleSave = async () => {
    if (queue.length === 0) {
      setError('Please add at least one video to the queue.');
      return;
    }

    if (!userId) {
      setError('Please select a user.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/update-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          queue,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      setSuccess(`Queue updated successfully!`);
      setIsUploading(false);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/?user=${userId}`);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Update error:', error);
      setError(`Update failed: ${errorMessage}`);
      setIsUploading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-background">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Video Queue Management
          </h1>
          <p className="text-muted-foreground">
            Manage video queue for users
          </p>
        </div>

        <div className="space-y-6 bg-card p-6 rounded-lg border border-border shadow-lg">
          {/* User Selection */}
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-foreground mb-2">
              Select User
            </label>
            {isLoadingUsers ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <select
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isUploading}
              >
                {availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))
                ) : (
                  <option value="user1">user1 (default)</option>
                )}
              </select>
            )}
          </div>

          {/* Add Video Section */}
          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Add Video to Queue</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVideo();
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isUploading || isLoadingUserData}
              />
              <button
                type="button"
                onClick={handleAddVideo}
                disabled={isUploading || isLoadingUserData || !newVideoUrl.trim()}
                className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Queue Management Section */}
          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Video Queue ({queue.length} {queue.length === 1 ? 'video' : 'videos'})
            </h2>
            {isLoadingUserData ? (
              <Skeleton className="h-32 w-full" />
            ) : queue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No videos in queue. Add videos above to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((videoUrl, index) => {
                  const videoId = getYouTubeId(videoUrl);
                  const displayUrl = videoUrl.length > 60 ? `${videoUrl.substring(0, 60)}...` : videoUrl;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-background border border-border rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {index + 1}. {displayUrl}
                        </div>
                        {videoId && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Video ID: {videoId}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={isUploading || index === 0}
                          className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={isUploading || index === queue.length - 1}
                          className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(index)}
                          disabled={isUploading}
                          className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message (Optional) */}
          <div className="border-t border-border pt-6">
            <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
              Message (Optional)
            </label>
            <input
              type="text"
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a custom message..."
              className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isUploading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isUploading || isLoadingUserData || queue.length === 0}
            className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Saving...' : 'Save Queue'}
          </button>

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
            >
              Admin Panel
            </button>
            <button
              type="button"
              onClick={() => router.push('/users')}
              className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
            >
              Manage Users
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

