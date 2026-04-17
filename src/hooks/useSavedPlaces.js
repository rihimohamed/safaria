import { useState, useEffect } from 'react';

const SAVED_PLACES_KEY = 'safarai_saved_places_v1';

export function useSavedPlaces() {
  const [savedPlaces, setSavedPlaces] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_PLACES_KEY);
      if (stored) {
        setSavedPlaces(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved places', e);
    }
  }, []);

  const savePlace = (placeData) => {
    // placeData should contain: id (or name), name, category, description, city, etc.
    const newPlace = {
      ...placeData,
      savedAt: new Date().toISOString(),
      id: placeData.id || placeData.name || placeData.stopName 
    };

    setSavedPlaces((prev) => {
      // Check if already saved
      if (prev.some(p => p.id === newPlace.id)) return prev;
      
      const newSaved = [newPlace, ...prev];
      try {
        localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(newSaved));
      } catch (e) {
        console.error('Failed to save place', e);
      }
      return newSaved;
    });
  };

  const removePlace = (id) => {
    setSavedPlaces((prev) => {
      const newSaved = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(newSaved));
      } catch (e) {
        console.error('Failed to remove place', e);
      }
      return newSaved;
    });
  };

  const isSaved = (id) => {
    return savedPlaces.some(p => p.id === id);
  };

  return { savedPlaces, savePlace, removePlace, isSaved };
}
