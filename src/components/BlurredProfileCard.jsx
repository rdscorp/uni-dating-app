import React from "react";
import "./BlurredProfileCard.css"; // Create this file for styling

const BlurredProfileCard = ({ profile }) => {
    return (
        <div className="blurred-card">
            <div className="profile-pic-container">
                <img src={profile.photos[0] || "/default-avatar.jpg"} alt="User" className="blurred-image" />
            </div>
            <div className="profile-info">
                <h3>{profile.name.split('')[0]}.</h3>
                <p>{profile.university}</p>
            </div>
        </div>
    );
};

export default BlurredProfileCard;
