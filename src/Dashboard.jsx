import { useState } from 'react';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [newSize, setNewSize] = useState('');

    const handleOpenStorage = async () => {
        setIsLoading(true);
        setMessage('Starting storage...');
        
        try {
            const response = await fetch('http://localhost:3001/api/start-tenant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: user.username,
                    userId: user.id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessage('Storage started! Redirecting in 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                // Redirect to the tenant's Nextcloud instance
                window.location.href = `http://localhost:${data.port}`;
            } else {
                setMessage(`Error: ${data.error}`);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error starting storage:', error);
            setMessage('Failed to start storage. Please try again.');
            setIsLoading(false);
        }
    };

    const handleUpdateStorage = () => {
        setShowUpdateModal(true);
        setNewSize(user.size.toString());
        setMessage('');
    };

    const handleUpdateSubmit = async () => {
        const sizeNum = parseInt(newSize);
        
        if (sizeNum < user.size) {
            setMessage('Error: New size must be greater than or equal to current size.');
            return;
        }
        
        if (sizeNum < 1) {
            setMessage('Error: Size must be at least 1 GB.');
            return;
        }
        
        setIsLoading(true);
        setMessage('Updating storage size...');
        
        try {
            const response = await fetch('http://localhost:3001/api/update-tenant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    newSize: sizeNum
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessage('Storage size updated successfully!');
                user.size = data.newSize; // Update local user object
                setTimeout(() => {
                    setShowUpdateModal(false);
                    setMessage('');
                    setIsLoading(false);
                }, 2000);
            } else {
                setMessage(`Error: ${data.error}`);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error updating storage:', error);
            setMessage('Failed to update storage. Please try again.');
            setIsLoading(false);
        }
    };

    const handleDeleteStorage = async () => {
        if (!window.confirm('Are you sure you want to delete your storage? This action cannot be undone.')) {
            return;
        }

        setIsLoading(true);
        setMessage('Deleting storage and account...');
        
        try {
            const response = await fetch('http://localhost:3001/api/delete-tenant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: user.username,
                    userId: user.id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessage('Storage and account deleted successfully!');
                setTimeout(() => {
                    alert('Your account has been deleted.');
                    onLogout();
                }, 1500);
            } else {
                setMessage(`Error: ${data.error}`);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error deleting storage:', error);
            setMessage('Failed to delete storage. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome, {user.username}!</h1>
                <button onClick={onLogout} className="logout-btn">Logout</button>
            </div>

            <div className="dashboard-content">
                <div className="user-info">
                    <h2>Account Information</h2>
                    <div className="info-item">
                        <span className="label">Username:</span>
                        <span className="value">{user.username}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Storage Size:</span>
                        <span className="value">{user.size} GB</span>
                    </div>
                </div>

                <div className="storage-controls">
                    <h2>Storage Management</h2>
                    {message && <div className="message">{message}</div>}

                    <div className="button-group">
                        <button
                            onClick={handleOpenStorage}
                            disabled={isLoading}
                            className="control-btn open-btn"
                        >
                            Open Storage
                        </button>

                        <button
                            onClick={handleUpdateStorage}
                            disabled={isLoading}
                            className="control-btn update-btn"
                        >
                            Update Storage
                        </button>

                        <button
                            onClick={handleDeleteStorage}
                            disabled={isLoading}
                            className="control-btn delete-btn"
                        >
                            Delete Storage
                        </button>
                    </div>
                </div>
            </div>

            {/* Update Storage Modal */}
            {showUpdateModal && (
                <div className="modal-overlay" onClick={() => !isLoading && setShowUpdateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Update Storage Size</h3>
                        <p>Current size: {user.size} GB</p>
                        <p className="modal-note">Note: You can only increase storage size, not decrease.</p>
                        
                        <div className="modal-input-group">
                            <label htmlFor="newSize">New Size (GB):</label>
                            <input
                                id="newSize"
                                type="number"
                                min={user.size}
                                value={newSize}
                                onChange={(e) => setNewSize(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        
                        {message && <div className="modal-message">{message}</div>}
                        
                        <div className="modal-buttons">
                            <button
                                onClick={handleUpdateSubmit}
                                disabled={isLoading}
                                className="control-btn update-btn"
                            >
                                Update
                            </button>
                            <button
                                onClick={() => setShowUpdateModal(false)}
                                disabled={isLoading}
                                className="control-btn cancel-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;