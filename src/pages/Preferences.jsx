import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, ChevronDown, Save, RotateCcw, Sparkles } from 'lucide-react';
import Card from '../components/Card';
import './Preferences.css';

// ─── Preference Definitions (35 prefs across 7 categories) ────────────────
const PREFERENCE_SECTIONS = [
  {
    id: 'travel_style',
    title: 'Travel Style',
    icon: 'flight_takeoff',
    description: 'How do you like to travel?',
    prefs: [
      { key: 'pace', q: 'What\'s your travel pace?', type: 'single', options: ['Slow & relaxed', 'Moderate', 'Fast-paced', 'Spontaneous'] },
      { key: 'planning', q: 'How do you plan trips?', type: 'single', options: ['Plan everything', 'Rough outline', 'Totally spontaneous', 'Mix of both'] },
      { key: 'companions', q: 'Who do you usually travel with?', type: 'single', options: ['Solo', 'Partner', 'Friends', 'Family with kids', 'Group tour'] },
      { key: 'accommodation', q: 'Preferred accommodation?', type: 'multi', options: ['Hotels', 'Riads', 'Hostels', 'Airbnb', 'Camping', 'Luxury resorts'] },
      { key: 'transport', q: 'How do you prefer to get around?', type: 'multi', options: ['Walking', 'Public transport', 'Rental car', 'Taxis', 'Private driver', 'Bicycle'] },
    ]
  },
  {
    id: 'budget',
    title: 'Budget & Spending',
    icon: 'payments',
    description: 'Your financial comfort zone',
    prefs: [
      { key: 'budget_level', q: 'What\'s your daily budget?', type: 'single', options: ['Backpacker (< $30)', 'Budget ($30–60)', 'Moderate ($60–120)', 'Comfort ($120–250)', 'Luxury ($250+)'] },
      { key: 'splurge_on', q: 'What do you splurge on?', type: 'multi', options: ['Food & dining', 'Accommodation', 'Experiences', 'Shopping', 'Nightlife', 'Wellness/Spa'] },
      { key: 'save_on', q: 'Where do you prefer to save?', type: 'multi', options: ['Food', 'Transport', 'Accommodation', 'Souvenirs', 'Activities'] },
      { key: 'currency_pref', q: 'Are you comfortable with cash-only places?', type: 'single', options: ['Yes, no problem', 'Prefer card options', 'Cash only is fine', 'Need ATM nearby'] },
    ]
  },
  {
    id: 'food',
    title: 'Food & Dining',
    icon: 'restaurant',
    description: 'Your culinary preferences',
    prefs: [
      { key: 'cuisine', q: 'What cuisines do you enjoy?', type: 'multi', options: ['Traditional Moroccan', 'Mediterranean', 'Street food', 'Fine dining', 'Vegetarian', 'Vegan', 'International', 'Seafood'] },
      { key: 'food_adventure', q: 'How adventurous is your palate?', type: 'single', options: ['Try everything!', 'Somewhat adventurous', 'Stick to familiar', 'Very picky'] },
      { key: 'dietary', q: 'Any dietary restrictions?', type: 'multi', options: ['None', 'Halal', 'Vegetarian', 'Vegan', 'Gluten-free', 'Lactose-free', 'Nut allergy', 'Kosher'] },
      { key: 'dining_style', q: 'Preferred dining atmosphere?', type: 'multi', options: ['Rooftop terraces', 'Street stalls', 'Garden restaurants', 'Luxury restaurants', 'Home cooking / Riad dining', 'Cafés'] },
      { key: 'tea_culture', q: 'Do you enjoy Moroccan tea culture?', type: 'single', options: ['Love it! 🍵', 'Interested to try', 'Not really', 'Prefer coffee'] },
    ]
  },
  {
    id: 'activities',
    title: 'Activities & Interests',
    icon: 'hiking',
    description: 'What excites you most',
    prefs: [
      { key: 'activities', q: 'Favorite activities?', type: 'multi', options: ['Historical sites', 'Hiking & trekking', 'Beaches', 'Desert tours', 'Surfing', 'Markets & souks', 'Photography', 'Art & galleries', 'Cooking classes', 'Nightlife', 'Wellness & hammam'] },
      { key: 'culture_interest', q: 'Cultural interests?', type: 'multi', options: ['Architecture', 'Music & festivals', 'Traditional crafts', 'Religious sites', 'Local traditions', 'Language learning', 'Calligraphy', 'Pottery & ceramics'] },
      { key: 'nature_pref', q: 'Nature preferences?', type: 'multi', options: ['Mountains (Atlas)', 'Desert (Sahara)', 'Beaches (Atlantic)', 'Forests (Cedar)', 'Oasis towns', 'Gorges & valleys', 'Waterfalls'] },
      { key: 'shopping_interest', q: 'What do you like to shop for?', type: 'multi', options: ['Rugs & carpets', 'Leather goods', 'Spices', 'Argan oil', 'Jewelry', 'Ceramics', 'Not interested in shopping'] },
      { key: 'fitness_level', q: 'Physical activity comfort?', type: 'single', options: ['Very fit — love challenges', 'Moderate fitness', 'Light walking only', 'Accessibility needs'] },
    ]
  },
  {
    id: 'comfort',
    title: 'Comfort & Practical',
    icon: 'health_and_safety',
    description: 'Your comfort needs',
    prefs: [
      { key: 'climate', q: 'Preferred climate?', type: 'single', options: ['Hot & sunny', 'Warm & mild', 'Cool mountain air', 'Don\'t mind any'] },
      { key: 'crowd_tolerance', q: 'How do you feel about crowds?', type: 'single', options: ['Love the energy', 'Don\'t mind', 'Prefer quieter spots', 'Avoid at all costs'] },
      { key: 'wake_time', q: 'Are you an early bird or night owl?', type: 'single', options: ['Early bird (sunrise!)', 'Morning person', 'Afternoon starter', 'Night owl 🦉'] },
      { key: 'connectivity', q: 'How important is Wi-Fi?', type: 'single', options: ['Essential (remote work)', 'Nice to have', 'Don\'t care', 'Prefer to disconnect'] },
      { key: 'language', q: 'Languages you speak?', type: 'multi', options: ['English', 'French', 'Arabic', 'Darija (Moroccan)', 'Spanish', 'German', 'Other'] },
    ]
  },
  {
    id: 'experience',
    title: 'Experience Level',
    icon: 'military_tech',
    description: 'Your Morocco knowledge',
    prefs: [
      { key: 'morocco_visits', q: 'How many times have you visited Morocco?', type: 'single', options: ['Never — first time!', 'Once before', '2–5 times', 'I\'m practically local'] },
      { key: 'cities_visited', q: 'Which cities have you visited?', type: 'multi', options: ['Marrakech', 'Fes', 'Casablanca', 'Rabat', 'Tangier', 'Chefchaouen', 'Essaouira', 'Ouarzazate', 'Agadir', 'Meknes', 'None yet!'] },
      { key: 'haggling', q: 'Are you comfortable with haggling?', type: 'single', options: ['I love it!', 'Getting better', 'Not really', 'Prefer fixed prices'] },
      { key: 'navigation', q: 'How good are you at navigating medinas?', type: 'single', options: ['Like a local', 'With a map/GPS', 'I get lost easily', 'First-timer'] },
    ]
  },
  {
    id: 'photography',
    title: 'Photography & Social',
    icon: 'photo_camera',
    description: 'Capturing your journey',
    prefs: [
      { key: 'photo_interest', q: 'How important is photography?', type: 'single', options: ['I\'m a serious photographer', 'Love taking photos', 'Casual snaps', 'Prefer to just experience'] },
      { key: 'photo_spots', q: 'What do you love to photograph?', type: 'multi', options: ['Landscapes', 'Architecture', 'People & portraits', 'Food', 'Street scenes', 'Sunsets', 'Wildlife'] },
      { key: 'social', q: 'Do you share on social media?', type: 'single', options: ['Instagram all day', 'Occasionally', 'Rarely', 'Never'] },
    ]
  },
];

const STORAGE_KEY = 'safarai_prefs_v2';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function savePrefs(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function Preferences() {
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [expandedSections, setExpandedSections] = useState(['travel_style']);
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Count answered prefs
  const totalPrefs = PREFERENCE_SECTIONS.reduce((sum, s) => sum + s.prefs.length, 0);
  const answeredPrefs = useMemo(() => {
    let count = 0;
    for (const section of PREFERENCE_SECTIONS) {
      for (const pref of section.prefs) {
        const val = prefs[pref.key];
        if (pref.type === 'multi' && Array.isArray(val) && val.length > 0) count++;
        else if (pref.type === 'single' && val) count++;
      }
    }
    return count;
  }, [prefs]);

  const progressPct = Math.round((answeredPrefs / totalPrefs) * 100);

  // Section answer counts
  const sectionCounts = useMemo(() => {
    const map = {};
    for (const section of PREFERENCE_SECTIONS) {
      let c = 0;
      for (const pref of section.prefs) {
        const val = prefs[pref.key];
        if (pref.type === 'multi' && Array.isArray(val) && val.length > 0) c++;
        else if (pref.type === 'single' && val) c++;
      }
      map[section.id] = c;
    }
    return map;
  }, [prefs]);

  // Filter sections by search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return PREFERENCE_SECTIONS;
    const q = searchQuery.toLowerCase();
    return PREFERENCE_SECTIONS.map(section => {
      const matchingPrefs = section.prefs.filter(p =>
        p.q.toLowerCase().includes(q) ||
        p.options.some(o => o.toLowerCase().includes(q))
      );
      if (matchingPrefs.length === 0) return null;
      return { ...section, prefs: matchingPrefs };
    }).filter(Boolean);
  }, [searchQuery]);

  const toggleSection = (id) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSingle = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
    setSaved(false);
  };

  const handleMulti = (key, value) => {
    setPrefs(prev => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
    setSaved(false);
  };

  const handleSave = () => {
    savePrefs(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all preferences? This cannot be undone.')) {
      setPrefs({});
      localStorage.removeItem(STORAGE_KEY);
      setSaved(false);
    }
  };

  return (
    <div className="preferences-container page-content glass">
      {/* Header */}
      <div className="pref-header">
        <div className="pref-icon-wrap">
          <span className="material-symbols-outlined pref-icon-main">tune</span>
        </div>
        <h2 className="pref-main-title">Travel Preferences</h2>
        <p className="pref-subtitle">
          Help SafarAI tailor perfect recommendations. Answer as many or as few as you like — every bit helps!
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="pref-progress-card">
        <div className="pref-progress-header">
          <div className="pref-progress-label">
            <Sparkles size={16} className="text-amber-500" />
            <span className="pref-progress-text">
              <strong>{answeredPrefs}</strong> of <strong>{totalPrefs}</strong> preferences answered
            </span>
          </div>
          <span className="pref-progress-pct">{progressPct}%</span>
        </div>
        <div className="pref-progress-track">
          <div className="pref-progress-fill" style={{ width: `${progressPct}%` }}></div>
        </div>
        <div className="pref-progress-tiers">
          <span className={`pref-tier ${progressPct >= 25 ? 'active' : ''}`}>Beginner</span>
          <span className={`pref-tier ${progressPct >= 50 ? 'active' : ''}`}>Explorer</span>
          <span className={`pref-tier ${progressPct >= 75 ? 'active' : ''}`}>Expert</span>
          <span className={`pref-tier ${progressPct >= 95 ? 'active' : ''}`}>Local 🏆</span>
        </div>
      </Card>

      {/* Search */}
      <div className="pref-search-wrap">
        <span className="material-symbols-outlined pref-search-icon">search</span>
        <input
          type="text"
          placeholder="Search preferences... (e.g. food, budget, hiking)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pref-search-input"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="pref-search-clear">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="pref-sections">
        {filteredSections.map((section, sIdx) => {
          const isExpanded = expandedSections.includes(section.id) || searchQuery.trim();
          const answered = sectionCounts[section.id] || 0;
          const total = PREFERENCE_SECTIONS.find(s => s.id === section.id)?.prefs.length || section.prefs.length;
          const isComplete = answered === total;

          return (
            <Card key={section.id} className={`pref-section-card ${isComplete ? 'complete' : ''}`}>
              <button
                className="pref-section-header"
                onClick={() => toggleSection(section.id)}
              >
                <div className="pref-section-left">
                  <div className={`pref-section-icon ${isComplete ? 'done' : ''}`}>
                    <span className="material-symbols-outlined">{section.icon}</span>
                  </div>
                  <div className="pref-section-meta">
                    <h3>{section.title}</h3>
                    <p>{section.description}</p>
                  </div>
                </div>
                <div className="pref-section-right">
                  <span className={`pref-section-badge ${isComplete ? 'done' : answered > 0 ? 'partial' : ''}`}>
                    {answered}/{total}
                  </span>
                  <ChevronDown size={20} className={`pref-chevron ${isExpanded ? 'open' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="pref-section-body">
                  {section.prefs.map((pref, pIdx) => {
                    const isAnswered = pref.type === 'multi'
                      ? Array.isArray(prefs[pref.key]) && prefs[pref.key].length > 0
                      : !!prefs[pref.key];

                    return (
                      <div key={pref.key} className="pref-question" style={{ animationDelay: `${pIdx * 0.04}s` }}>
                        <div className="pref-q-header">
                          <h4>{pref.q}</h4>
                          {pref.type === 'multi' && <span className="pref-q-hint">Select multiple</span>}
                          {isAnswered && <CheckCircle size={16} className="pref-q-check" />}
                        </div>
                        <div className="pref-options">
                          {pref.options.map(opt => {
                            const selected = pref.type === 'multi'
                              ? (prefs[pref.key] || []).includes(opt)
                              : prefs[pref.key] === opt;

                            return (
                              <button
                                key={opt}
                                className={`pref-opt-btn ${selected ? 'selected' : ''}`}
                                onClick={() => pref.type === 'multi' ? handleMulti(pref.key, opt) : handleSingle(pref.key, opt)}
                              >
                                {selected && <CheckCircle size={14} className="pref-opt-check" />}
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="pref-actions">
        <button className="pref-action-btn reset" onClick={handleReset}>
          <RotateCcw size={16} /> Reset All
        </button>
        <button className={`pref-action-btn save ${saved ? 'saved' : ''}`} onClick={handleSave}>
          {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Preferences</>}
        </button>
      </div>
    </div>
  );
}
