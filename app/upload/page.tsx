"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref as dbRef, get } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';

export default function UploadPage() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [userId, setUserId] = useState<string>('user1');
  const [message, setMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoUrl) {
      setError('Please enter a YouTube URL.');
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
          videoUrl,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      setSuccess(`Video updated successfully!`);
      setIsUploading(false);

      // Reset form
      setVideoUrl('');
      setMessage('');

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
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            Update Video
          </h1>
          <p className="text-muted-foreground">
            Enter a YouTube URL to play for the user
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border border-border shadow-lg">
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

          {/* YouTube URL Input */}
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-foreground mb-2">
              YouTube URL
            </label>
            <input
              type="text"
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
              disabled={isUploading}
            />
          </div>

          {/* Message (Optional) */}
          <div>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || !videoUrl}
            className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Updating...' : 'Update Video'}
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
        </form>
      </div>
    </main>
  );
}

