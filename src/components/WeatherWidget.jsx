import React from 'react';
import { Sun, CloudRain, Thermometer } from 'lucide-react';
import './WeatherWidget.css';

export default function WeatherWidget({ temp = '24', condition = 'Sunny', location = 'Paris' }) {
  return (
    <div className="weather-widget glass">
      <div className="weather-header">
        <span className="weather-location">{location}</span>
        <Thermometer size={16} style={{ color: "var(--text-secondary)" }} />
      </div>
      <div className="weather-main">
        {condition.toLowerCase().includes('rain') ? (
          <CloudRain size={36} className="weather-icon blue" />
        ) : (
          <Sun size={36} className="weather-icon orange" />
        )}
        <div className="weather-temp">
          <span className="temp-value">{temp}°</span>
          <span className="temp-condition">{condition}</span>
        </div>
      </div>
    </div>
  );
}
