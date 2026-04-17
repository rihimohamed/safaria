import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MapPin, Trash2, Navigation } from 'lucide-react';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import './SavedPlaces.css';

// Simple helper to guess image (using LoremFlickr just like elsewhere, but we can save image URL later)
const getFallbackImage = (cityName, placeName) => {
  const query = encodeURIComponent((cityName || placeName || 'morocco').split(' ')[0]);
  return `https://loremflickr.com/800/600/morocco,${query}?lock=${placeName?.length || 1}`;
};

export default function SavedPlaces() {
  const { savedPlaces, removePlace } = useSavedPlaces();
  const navigate = useNavigate();

  return (
    <div className="saved-places-container page-content glass">
      {/* Header */}
      <div className="saved-header">
        <div className="saved-icon-wrap">
          <span className="material-symbols-outlined saved-icon-main">bookmark</span>
        </div>
        <h2 className="saved-main-title">Saved Places</h2>
        <p className="saved-subtitle">
          Your personal bucket list of Moroccan destinations, landmarks, and hidden gems.
        </p>
      </div>

      {savedPlaces.length === 0 ? (
        <div className="saved-empty">
          <span className="material-symbols-outlined saved-empty-icon">luggage</span>
          <h3>Your bucket list is empty</h3>
          <p>Explore the Trip Planner and save places you want to visit later.</p>
          <button 
            onClick={() => navigate('/trips')}
            className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 mx-auto hover:bg-teal-700 transition-colors"
          >
            <Navigation size={18} />
            Go to Trip Planner
          </button>
        </div>
      ) : (
        <div className="saved-grid">
          {savedPlaces.map((place) => {
            const isCity = place.type === 'city'; // 'city' vs 'poi'
            const title = place.name || place.stopName;
            const city = place.city || place.stopName; // If it's a roadtrip stop, the city is the stopName
            const imageStr = getFallbackImage(city, title);
            
            return (
              <div key={place.id} className="saved-card animate-fade-in-up">
                <div className="saved-image-wrapper">
                  <div className="image-placeholder">
                    <span className="material-symbols-outlined text-stone-400 text-3xl">image</span>
                  </div>
                  <img src={imageStr} alt={title} className="saved-image relative z-10" loading="lazy" />
                  <div className="saved-image-overlay z-10"></div>
                  
                  <div className="saved-badge z-20">
                    <span className="material-symbols-outlined text-[14px]">
                      {place.category ? 'push_pin' : 'location_city'}
                    </span>
                    {place.category || 'Destination'}
                  </div>
                  
                  <button 
                    onClick={() => removePlace(place.id)}
                    className="remove-btn z-20"
                    title="Remove from saved"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="saved-info">
                  <h3 className="saved-title">{title}</h3>
                  <div className="saved-city">
                    <MapPin size={14} className="text-primary" />
                    {city}
                  </div>
                  
                  <p className="saved-desc">
                    {place.description || (place.activities && place.activities.join(' • ')) || 'No description available.'}
                  </p>
                  
                  <button 
                    onClick={() => navigate('/trips')}
                    className="saved-explore-btn"
                  >
                    <Navigation size={18} /> Plan a Trip Here
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
