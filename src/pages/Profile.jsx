import React from 'react';
import { User, Map, CreditCard, LogOut, Settings } from 'lucide-react';
import Card from '../components/Card';
import './Profile.css';

export default function Profile() {
  return (
    <div className="profile-container page-content glass">
      <div className="profile-header">
        <div className="profile-avatar">
          <User size={48} color="white" />
        </div>
        <div className="profile-info">
          <h2>Alex Wanderlust</h2>
          <p>Explorer Level 4 &bull; Member since 2023</p>
        </div>
        <button className="edit-profile-btn glass"><Settings size={18} /> Edit Profile</button>
      </div>

      <div className="profile-grid">
        <div className="profile-col-left">
          <Card className="profile-menu">
            <button className="menu-item active"><User size={20} /> Personal Info</button>
            <button className="menu-item"><Map size={20} /> Saved Trips (12)</button>
            <button className="menu-item"><CreditCard size={20} /> Payment Methods</button>
            <button className="menu-item"><Settings size={20} /> Preferences</button>
            <div className="menu-divider"></div>
            <button className="menu-item danger"><LogOut size={20} /> Log Out</button>
          </Card>
        </div>

        <div className="profile-col-right">
          <Card className="profile-details">
            <h3>Personal Information</h3>
            <div className="info-group">
              <label>Full Name</label>
              <input type="text" value="Alex Wanderlust" readOnly />
            </div>
            <div className="info-group">
              <label>Email Address</label>
              <input type="email" value="alex@example.com" readOnly />
            </div>
            <div className="info-group">
              <label>Phone Number</label>
              <input type="tel" value="+1 (555) 123-4567" readOnly />
            </div>
            
            <h3 style={{ marginTop: '2rem' }}>Travel Preferences Summary</h3>
            <div className="pref-summary">
              <span className="pref-tag">Tropical Climate</span>
              <span className="pref-tag">Moderate Budget</span>
              <span className="pref-tag">1-2 Weeks</span>
              <span className="pref-tag">Beaches</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
