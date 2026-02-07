import React from 'react';
import Avatar from 'react-avatar';

const Client = ({ username, color, isOnline = true }) => {
    return (
        <div className="client">
            <div className="avatar-wrapper">
                <Avatar
                    name={username}
                    size={45} // Slightly increased for better visibility
                    round="8px" // Changed to match the "sharp edges" logo theme
                    color={color}
                    className="client-avatar"
                />
                {/* Online/Offline Status Indicator */}
                <span
                    className={`status-dot ${isOnline ? 'online' : 'offline'}`}
                    title={isOnline ? 'Online' : 'Offline'}
                />
            </div>

            {/* Username with truncation handling for long names */}
            <span className="userName" title={username}>
                {username}
            </span>
        </div>
    );
};

export default Client;