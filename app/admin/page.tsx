"use client";
// pages/admin.js
import { useState, useEffect } from 'react';
import { ref, update, onValue, get } from 'firebase/database';
import { database } from '../../lib/firebase'; // Import our database config

// Simple styling for the admin panel
const styles = {
    container: {
        padding: '20px',
        fontFamily: 'sans-serif',
        maxWidth: '600px',
        margin: '40px auto',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        borderRadius: '8px'
    },
    input: {
        width: 'calc(100% - 22px)',
        padding: '10px',
        margin: '10px 0',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px'
    },
    select: {
        width: '100%',
        padding: '10px',
        margin: '10px 0',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: 'white'
    },
    button: {
        width: '100%',
        padding: '12px',
        fontSize: '18px',
        backgroundColor: '#0070f3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px'
    },
    buttonDisabled: {
        width: '100%',
        padding: '12px',
        fontSize: '18px',
        backgroundColor: '#ccc',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'not-allowed',
        marginTop: '10px'
    },
    label: {
        fontWeight: 'bold'
    },
    hr: {
        border: 'none',
        borderTop: '1px solid #eee',
        margin: '20px 0'
    },
    fileInput: {
        width: 'calc(100% - 22px)',
        padding: '10px',
        margin: '10px 0',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px'
    },
    loading: {
        color: '#666',
        fontStyle: 'italic'
    }
};

interface VideoOption {
    url: string;
    userId: string;
    userName: string;
}

const AdminPage = () => {
    const [userId, setUserId] = useState('user1'); // Default user to control
    const [videoUrl, setVideoUrl] = useState('');
    const [message, setMessage] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [availableUsers, setAvailableUsers] = useState<string[]>([]);
    const [availableVideos, setAvailableVideos] = useState<VideoOption[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingVideos, setIsLoadingVideos] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Load available users from Firebase
    useEffect(() => {
        const usersRef = ref(database, 'users');
        
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const users = Object.keys(usersData);
                setAvailableUsers(users);
                
                // Extract video URLs from all users
                const videos: VideoOption[] = [];
                Object.keys(usersData).forEach((uid) => {
                    const userData = usersData[uid];
                    if (userData && userData.videoUrl) {
                        videos.push({
                            url: userData.videoUrl,
                            userId: uid,
                            userName: userData.name || uid
                        });
                    }
                });
                setAvailableVideos(videos);
                
                // Set default user if current userId is not in the list
                setUserId((currentUserId) => {
                    if (users.length > 0 && !users.includes(currentUserId)) {
                        return users[0];
                    }
                    return currentUserId;
                });
            }
            setIsLoadingUsers(false);
            setIsLoadingVideos(false);
        }, (error) => {
            console.error('Error loading users:', error);
            setIsLoadingUsers(false);
            setIsLoadingVideos(false);
        });

        return () => unsubscribe();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            // Validate file type
            if (!selectedFile.type.startsWith('video/')) {
                alert('Please select a video file.');
                return;
            }
            setVideoFile(selectedFile);
            // Clear URL input when file is selected
            setVideoUrl('');
        }
    };

    const handleUpdate = async () => {
        if (!userId) {
            alert('Please select a User ID to control.');
            return;
        }

        // If video file is selected, upload it first
        if (videoFile) {
            setIsUploading(true);
            setUploadProgress(0);

            try {
                const formData = new FormData();
                formData.append('file', videoFile);
                formData.append('userId', userId);
                if (message) {
                    formData.append('message', message);
                }

                // Simulate progress
                const progressInterval = setInterval(() => {
                    setUploadProgress((prev) => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 200);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                clearInterval(progressInterval);
                setUploadProgress(95);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Upload failed');
                }

                const result = await response.json();
                setUploadProgress(100);
                
                // Update videoUrl with the uploaded file URL
                const newVideoUrl = result.downloadURL;
                
                // Update the database with the new video URL and message if provided
                const userRef = ref(database, 'users/' + userId);
                const updates: Record<string, string> = {
                    videoUrl: newVideoUrl
                };
                if (message) {
                    updates.message = message;
                }
                await update(userRef, updates);

                alert(`✅ Video uploaded and update sent to ${userId}! Check the TV.`);
                
                // Reset form
                setVideoFile(null);
                setMessage('');
                setVideoUrl('');
                setIsUploading(false);
                setUploadProgress(0);
                return;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                alert(`Upload failed: ${errorMessage}`);
                setIsUploading(false);
                setUploadProgress(0);
                return;
            }
        }

        // If no file but URL or message provided, update directly
        console.log(`Updating user: ${userId}`);
        
        // Create a reference to the specific user in Firebase
        const userRef = ref(database, 'users/' + userId);

        // Get existing user data to preserve name
        let userName = userId;
        try {
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const existingData = snapshot.val();
                userName = existingData.name || userId;
            }
        } catch (error) {
            console.warn('Could not fetch existing user data:', error);
        }

        // Prepare the data to update
        const updates: Record<string, string> = {
            name: userName // Always preserve the name
        };
        if (videoUrl) {
            updates.videoUrl = videoUrl;
        }
        if (message) {
            updates.message = message;
        }

        if (!videoUrl && !message) {
            alert('Please select a Video URL from the dropdown, upload a video file, or enter a new Message to send.');
            return;
        }

        // Send the update to Firebase
        try {
            await update(userRef, updates);
            alert(`✅ Update sent to ${userId}! Check the TV.`);
            
            // Reset form
            setVideoUrl('');
            setMessage('');
            setVideoFile(null);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to update: ${errorMessage}`);
            console.error('Update error:', error);
        }
    };

    return (
        <div style={styles.container}>
            <h1>📺 TV Remote Control Panel</h1>
            
            <label style={styles.label} htmlFor="userId">User ID to Control:</label>
            {isLoadingUsers ? (
                <div style={styles.loading}>Loading users...</div>
            ) : (
                <select
                    id="userId"
                    style={styles.select}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
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

            <hr style={styles.hr} />

            <label style={styles.label} htmlFor="videoFile">Upload New Video File:</label>
            <input
                id="videoFile"
                type="file"
                accept="video/*"
                style={styles.fileInput}
                onChange={handleFileChange}
                disabled={isUploading}
            />
            {videoFile && (
                <div style={{ fontSize: '14px', color: '#666', marginTop: '-5px' }}>
                    Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
            )}

            <div style={{ textAlign: 'center', margin: '10px 0', color: '#666' }}>OR</div>

            <label style={styles.label} htmlFor="videoUrl">Select Video URL:</label>
            {isLoadingVideos ? (
                <div style={styles.loading}>Loading videos...</div>
            ) : (
                <select
                    id="videoUrl"
                    style={styles.select}
                    value={videoUrl}
                    onChange={(e) => {
                        setVideoUrl(e.target.value);
                        // Clear file selection when URL is selected
                        if (e.target.value) {
                            setVideoFile(null);
                        }
                    }}
                    disabled={isUploading}
                >
                    <option value="">-- Select a video URL --</option>
                    {availableVideos.map((video, index) => (
                        <option key={`${video.userId}-${index}`} value={video.url}>
                            {video.userName} ({video.userId}) - {video.url.length > 50 ? video.url.substring(0, 50) + '...' : video.url}
                        </option>
                    ))}
                </select>
            )}
            
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <label style={styles.label} htmlFor="newVideoUrl">Or Enter New Video URL:</label>
                <input
                    id="newVideoUrl"
                    type="text"
                    style={styles.input}
                    onChange={(e) => {
                        if (e.target.value) {
                            setVideoUrl(e.target.value);
                            setVideoFile(null);
                        }
                    }}
                    placeholder="Paste a new video URL here"
                    disabled={isUploading}
                />
            </div>

            <label style={styles.label} htmlFor="message">New Message:</label>
            <input
                id="message"
                type="text"
                style={styles.input}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter a new welcome message"
                disabled={isUploading}
            />

            {isUploading && (
                <div style={{ margin: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#eee', borderRadius: '4px', height: '8px' }}>
                        <div
                            style={{
                                width: `${uploadProgress}%`,
                                backgroundColor: '#0070f3',
                                height: '8px',
                                borderRadius: '4px',
                                transition: 'width 0.3s'
                            }}
                        />
                    </div>
                </div>
            )}
            
            <button 
                style={isUploading ? styles.buttonDisabled : styles.button} 
                onClick={handleUpdate}
                disabled={isUploading}
            >
                {isUploading ? 'Uploading...' : 'Update TV Screen'}
            </button>
        </div>
    );
};

export default AdminPage;
