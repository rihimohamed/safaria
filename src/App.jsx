import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Global Styles
import './App.css';

// Components
import Layout from './components/Layout';

// Real views
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Destinations from './pages/Destinations';
import TripPlanner from './pages/TripPlanner';
import Preferences from './pages/Preferences';
import Profile from './pages/Profile';
import SmartBackpack from './pages/SmartBackpack';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Activities from './pages/Activities';
import SavedPlaces from './pages/SavedPlaces';
import FloatingChat from './components/FloatingChat';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing & Auth - Full screen, no layout container */}
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Auth />} />
        
        {/* Main App Layout */}
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/trips" element={<TripPlanner />} />
              <Route path="/favorites" element={<SavedPlaces />} />
              <Route path="/settings" element={<Preferences />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/backpack" element={<SmartBackpack />} />
            </Routes>
          </Layout>
        } />
      </Routes>
      <FloatingChat />
    </Router>
  );
}

export default App;
