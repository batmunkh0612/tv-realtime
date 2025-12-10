"use client";
import { useState, useEffect } from 'react';
import { ref, update, onValue, get } from 'firebase/database';
import { database } from '../../lib/firebase';

const styles = {
    container: {
        padding: '20px',
        fontFamily: 'sans-serif',
        maxWidth: '800px',
        margin: '40px auto',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        backgroundColor: '#fff'
    },
    header: {
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #eee'
    },
    tvIndicator: {
        display: 'inline-block',
        padding: '8px 16px',
        backgroundColor: '#ff0000',
        color: 'white',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        marginLeft: '10px'
    },
    section: {
        marginBottom: '30px'
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        marginBottom: '15px',
        color: '#333'
    },
    templateGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '15px',
        marginTop: '15px'
    },
    templateCard: {
        padding: '20px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#e0e0e0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: '#fff'
    },
    templateCardHover: {
        borderColor: '#0070f3',
        backgroundColor: '#f0f8ff',
        transform: 'scale(1.02)'
    },
    templateCardActive: {
        borderColor: '#0070f3',
        backgroundColor: '#e3f2fd',
        boxShadow: '0 0 0 3px rgba(0, 112, 243, 0.1)'
    },
    templateName: {
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333'
    },
    templateInfo: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '4px'
    },
    currentBadge: {
        display: 'inline-block',
        padding: '4px 8px',
        backgroundColor: '#4caf50',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        marginTop: '8px'
    },
    button: {
        width: '100%',
        padding: '15px',
        fontSize: '18px',
        backgroundColor: '#0070f3',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        marginTop: '10px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s'
    },
    buttonDisabled: {
        width: '100%',
        padding: '15px',
        fontSize: '18px',
        backgroundColor: '#ccc',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'not-allowed',
        marginTop: '10px'
    },
    loading: {
        textAlign: 'center' as const,
        padding: '40px',
        color: '#666',
        fontSize: '16px'
    },
    currentlyPlaying: {
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginBottom: '20px'
    },
    videoPreview: {
        fontSize: '14px',
        color: '#666',
        marginTop: '8px',
        wordBreak: 'break-all' as const
    }
};

interface UserData {
    name: string;
    videoUrl?: string;
    queue?: string[];
    message?: string;
}

const TV_USER_ID = 'user1';

const AdminPage = () => {
    const [allUsers, setAllUsers] = useState<Record<string, UserData>>({});
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [hoveredTemplateId, setHoveredTemplateId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const usersRef = ref(database, 'users');
        
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                setAllUsers(usersData);
                
                const tvData = usersData[TV_USER_ID];
                if (tvData?.videoUrl) {
                    Object.keys(usersData).forEach((uid) => {
                        if (uid !== TV_USER_ID && usersData[uid]?.videoUrl === tvData.videoUrl) {
                            setSelectedTemplateId(uid);
                        }
                    });
                }
            }
            setIsLoading(false);
        }, (error) => {
            console.error('Error loading users:', error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplateId(templateId);
    };

    const handleUpdateTV = async () => {
        if (!selectedTemplateId) {
            alert('Please select a template first');
            return;
        }

        setIsUpdating(true);

        try {
            const templateData = allUsers[selectedTemplateId];
            
            if (!templateData) {
                throw new Error('Template not found');
            }

            console.log(`📺 Updating TV (${TV_USER_ID}) with template:`, selectedTemplateId, templateData);

            const tvRef = ref(database, `users/${TV_USER_ID}`);
            const tvSnapshot = await get(tvRef);
            let tvName = TV_USER_ID;
            if (tvSnapshot.exists()) {
                tvName = tvSnapshot.val().name || TV_USER_ID;
            }

            const updates: {
                name: string;
                videoUrl?: string;
                queue?: string[];
                message?: string;
            } = {
                name: tvName
            };

            if (templateData.videoUrl) {
                updates.videoUrl = templateData.videoUrl;
            }
            if (templateData.queue) {
                updates.queue = templateData.queue;
            }
            if (templateData.message) {
                updates.message = templateData.message;
            }

            console.log('Sending update:', updates);
            await update(tvRef, updates);
            console.log('✅ Update successful');

            const verifySnapshot = await get(tvRef);
            if (verifySnapshot.exists()) {
                const savedData = verifySnapshot.val();
                console.log('✅ Verified TV data:', savedData);
                
                const templateName = templateData.name || selectedTemplateId;
                alert(`✅ TV Updated!\n\nNow playing: ${templateName}\n\nVideo: ${savedData.videoUrl || 'None'}\nQueue: ${savedData.queue ? savedData.queue.length + ' videos' : 'None'}\n\nCheck TV at: http://localhost:9002/?user=${TV_USER_ID}`);
            }

            setIsUpdating(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to update TV: ${errorMessage}`);
            console.error('Update error:', error);
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading templates...</div>
            </div>
        );
    }

    const tvData = allUsers[TV_USER_ID];
    const templateUsers = Object.keys(allUsers).filter(uid => uid !== TV_USER_ID);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={{ margin: 0, display: 'inline-block' }}>📺 TV Control Panel</h1>
                <span style={styles.tvIndicator}>🔴 LIVE</span>
                <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                    Controlling: <strong>{TV_USER_ID}</strong>
                </div>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>📡 Currently Playing on TV</div>
                <div style={styles.currentlyPlaying}>
                    {tvData ? (
                        <>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                                {tvData.name || TV_USER_ID}
                            </div>
                            {tvData.message && (
                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                    Message: {tvData.message}
                                </div>
                            )}
                            {tvData.videoUrl && (
                                <div style={styles.videoPreview}>
                                    Video: {tvData.videoUrl}
                                </div>
                            )}
                            {tvData.queue && tvData.queue.length > 0 && (
                                <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                                    Queue: {tvData.queue.length} video(s)
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ color: '#999' }}>No data</div>
                    )}
                </div>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>🎬 Select Template to Display</div>
                {templateUsers.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No templates available. Create more users in Firebase to use as templates.
                    </div>
                ) : (
                    <div style={styles.templateGrid}>
                        {templateUsers.map((uid) => {
                            const userData = allUsers[uid];
                            const isSelected = selectedTemplateId === uid;
                            const isHovered = hoveredTemplateId === uid;
                            const isCurrent = tvData?.videoUrl === userData?.videoUrl;
                            
                            return (
                                <div
                                    key={uid}
                                    style={{
                                        ...styles.templateCard,
                                        ...(isSelected ? styles.templateCardActive : {}),
                                        ...(isHovered && !isSelected ? styles.templateCardHover : {})
                                    }}
                                    onClick={() => handleTemplateSelect(uid)}
                                    onMouseEnter={() => setHoveredTemplateId(uid)}
                                    onMouseLeave={() => setHoveredTemplateId('')}
                                >
                                    <div style={styles.templateName}>
                                        {userData?.name || uid}
                                    </div>
                                    {userData?.message && (
                                        <div style={styles.templateInfo}>
                                            📝 {userData.message}
                                        </div>
                                    )}
                                    {userData?.videoUrl && (
                                        <div style={styles.templateInfo}>
                                            🎥 Single Video
                                        </div>
                                    )}
                                    {userData?.queue && userData.queue.length > 0 && (
                                        <div style={styles.templateInfo}>
                                            📚 {userData.queue.length} videos
                                        </div>
                                    )}
                                    {isCurrent && (
                                        <div style={styles.currentBadge}>
                                            ✓ Currently Playing
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <button 
                style={isUpdating || !selectedTemplateId ? styles.buttonDisabled : styles.button}
                onClick={handleUpdateTV}
                disabled={isUpdating || !selectedTemplateId}
                onMouseEnter={(e) => {
                    if (!isUpdating && selectedTemplateId) {
                        e.currentTarget.style.backgroundColor = '#005bb5';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isUpdating && selectedTemplateId) {
                        e.currentTarget.style.backgroundColor = '#0070f3';
                    }
                }}
            >
                {isUpdating ? 'Updating TV...' : selectedTemplateId ? `📺 Update TV with ${allUsers[selectedTemplateId]?.name || selectedTemplateId}` : 'Select a Template First'}
            </button>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px', fontSize: '14px' }}>
                <strong>💡 How it works:</strong>
                <ol style={{ marginTop: '10px', marginBottom: 0 }}>
                    <li>Select a template by clicking on it</li>
                    <li>Click the &quot;Update TV&quot; button</li>
                    <li>The TV will immediately switch to show the selected template&apos;s videos</li>
                </ol>
            </div>
        </div>
    );
};

export default AdminPage;
