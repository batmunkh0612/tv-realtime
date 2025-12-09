"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref as dbRef, set, remove, onValue } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';

interface UserData {
  name: string;
  videoUrl: string;
  message?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Record<string, UserData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserData>({
    name: '',
    videoUrl: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load users from Firebase
  useEffect(() => {
    const usersRef = dbRef(database, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      } else {
        setUsers({});
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please check your Firebase connection.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = (userId: string, userData: UserData) => {
    setEditingUserId(userId);
    setFormData({
      name: userData.name || '',
      videoUrl: userData.videoUrl || '',
      message: userData.message || '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      videoUrl: '',
      message: '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingUserId) {
        // Update existing user
        const userRef = dbRef(database, `users/${editingUserId}`);
        await set(userRef, {
          name: formData.name,
          videoUrl: formData.videoUrl,
          ...(formData.message && { message: formData.message }),
        });
        setSuccess(`User "${editingUserId}" updated successfully!`);
      } else {
        // Create new user - need to generate user ID
        const newUserId = formData.name.toLowerCase().replace(/\s+/g, '') || `user${Date.now()}`;
        const userRef = dbRef(database, `users/${newUserId}`);
        await set(userRef, {
          name: formData.name,
          videoUrl: formData.videoUrl,
          ...(formData.message && { message: formData.message }),
        });
        setSuccess(`User "${newUserId}" created successfully!`);
      }

      handleCancel();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to save user: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(`Are you sure you want to delete user "${userId}"?`)) {
      return;
    }

    try {
      const userRef = dbRef(database, `users/${userId}`);
      await remove(userRef);
      setSuccess(`User "${userId}" deleted successfully!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to delete user: ${errorMessage}`);
    }
  };

  const handleViewUser = (userId: string) => {
    router.push(`/?user=${userId}`);
  };

  const userList = Object.entries(users);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-background">
      <div className="w-full max-w-6xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              User Management
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/90 rounded-md transition-colors"
              >
                Admin Panel
              </button>
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/90 rounded-md transition-colors"
              >
                Upload Video
              </button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Manage users and their content. Click &quot;View&quot; to see their TV display.
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-md">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* User List */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-lg">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {editingUserId ? 'Edit User' : 'Add New User'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isSubmitting}
                  placeholder="Enter user name"
                />
              </div>

              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-foreground mb-2">
                  Video URL *
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isSubmitting}
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message (Optional)
                </label>
                <input
                  type="text"
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isSubmitting}
                  placeholder="Custom welcome message"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : editingUserId ? 'Update User' : 'Create User'}
                </button>
                {editingUserId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-lg">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              All Users ({userList.length})
            </h2>
            
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : userList.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No users found. Create your first user!
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {userList.map(([userId, userData]) => (
                  <div
                    key={userId}
                    className="p-4 border border-border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {userData.name || userId}
                        </h3>
                        <p className="text-sm text-muted-foreground">ID: {userId}</p>
                        {userData.message && (
                          <p className="text-sm text-muted-foreground mt-1">
                            &quot;{userData.message}&quot;
                          </p>
                        )}
                        {userData.videoUrl && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {userData.videoUrl}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleViewUser(userId)}
                        className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(userId, userData)}
                        className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(userId)}
                        className="px-3 py-1 text-xs font-medium bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

