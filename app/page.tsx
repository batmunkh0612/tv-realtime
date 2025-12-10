"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, onValue, DataSnapshot } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/VideoPlayer';

interface UserData {
  name: string;
  videoUrl: string;
  queue?: string[];
  message?: string;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get('user') || 'user1';

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<Record<string, UserData>>({});
  const [showMenu, setShowMenu] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const userIds = Object.keys(allUsers);
  const currentUserIndex = userIds.indexOf(userId);
  const [selectedIndex, setSelectedIndex] = useState(() =>
    currentUserIndex >= 0 ? currentUserIndex : 0
  );

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        setAllUsers(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log(`🔄 Setting up Firebase listener for user: ${userId}`);
    
    const userRef = ref(database, `users/${userId}`);

    const unsubscribe = onValue(
      userRef,
      (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        const timestamp = new Date().toLocaleTimeString();
        console.log(`📡 Firebase update received for ${userId} at ${timestamp}:`, data);
        if (data) {
          console.log(`📺 Video URL: ${data.videoUrl}`);
          console.log(`📺 Queue: ${data.queue ? JSON.stringify(data.queue) : 'none'}`);
          console.log(`📺 Message: ${data.message || 'none'}`);
          setUserData(data);
          setLastUpdate(timestamp);
        } else {
          console.warn(`⚠️ No data found for user: ${userId}`);
        }
        setIsLoading(false);
      },
      (error: Error) => {
        console.error("❌ Firebase read failed: " + error.message);
        setIsLoading(false);
      }
    );

    return () => {
      console.log(`🔌 Unsubscribing Firebase listener for user: ${userId}`);
      unsubscribe();
    };
  }, [userId]);

  React.useEffect(() => {
    if (showMenu) {
      const newIndex = currentUserIndex >= 0 ? currentUserIndex : 0;
      if (newIndex !== selectedIndex) {
        setSelectedIndex(newIndex);
      }
    }
  }, [showMenu, currentUserIndex, selectedIndex]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const userIds = Object.keys(allUsers);
      if (userIds.length === 0) return;

      if (showMenu) {
        switch (e.key) {
          case 'ArrowUp':
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : userIds.length - 1));
            e.preventDefault();
            break;
          case 'ArrowDown':
            setSelectedIndex((prev) => (prev < userIds.length - 1 ? prev + 1 : 0));
            e.preventDefault();
            break;
          case 'Enter':
          case ' ':
            const selectedUserId = userIds[selectedIndex];
            router.push(`/?user=${selectedUserId}`);
            setShowMenu(false);
            e.preventDefault();
            break;
          case 'Escape':
          case 'Backspace':
            setShowMenu(false);
            e.preventDefault();
            break;
        }
      } else {
        switch (e.key) {
          case 'm':
          case 'M':
          case 'Menu':
          case 'F1':
            setShowMenu(true);
            e.preventDefault();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showMenu, selectedIndex, allUsers, router]);

  return (
    <main className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      <VideoPlayer
        key={`${userData?.videoUrl}-${userData?.queue?.join(',') || ''}`}
        isLoading={isLoading}
        videoUrl={userData?.videoUrl}
        queue={userData?.queue}
      />

      {showMenu && userIds.length > 0 && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4 border-2 border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Select Video
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {userIds.map((uid, index) => {
                const user = allUsers[uid];
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={uid}
                    onClick={() => {
                      router.push(`/?user=${uid}`);
                      setShowMenu(false);
                    }}
                    className={`
                      p-4 rounded-lg cursor-pointer transition-all
                      ${isSelected
                        ? 'bg-blue-600 text-white scale-105 border-2 border-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-semibold">
                          {user.name || uid}
                        </div>
                        {user.message && (
                          <div className="text-sm mt-1 opacity-80">
                            {user.message}
                          </div>
                        )}
                        {uid === userId && (
                          <div className="text-xs mt-1 opacity-60">
                            Currently Playing
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="text-2xl">▶</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 text-center text-gray-400 text-sm">
              <div>↑↓ Navigate | Enter Select | Esc Close</div>
              <div className="mt-2">Press M or Menu to open this menu</div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-xs space-y-1">
        <div>User: <span className="font-mono">{userId}</span></div>
        {lastUpdate && <div>Last Update: {lastUpdate}</div>}
        {userData?.videoUrl && (
          <div className="max-w-xs truncate">
            Video: {userData.videoUrl.substring(0, 40)}...
          </div>
        )}
      </div>

      {!showMenu && userIds.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm opacity-0 animate-fade-in">
          Press M for Menu
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="fixed inset-0 w-full h-full bg-black overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
